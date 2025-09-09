import { supabase } from '@/lib/supabase'

export interface Product {
  id?: string
  code?: string
  description: string
  unit_price: number
  itbms_rate: number
  is_service: boolean
  is_active?: boolean  // true = active, false = inactive
  created_at?: string
  updated_at?: string
}

export interface ProductFilters {
  search?: string
  isService?: boolean
  isActive?: boolean
  priceMin?: number
  priceMax?: number
  dateFrom?: string
  dateTo?: string
}

export interface ProductStats {
  total: number
  services: number
  totalValue: number
}

export class ProductService {
  // Get products with optional filtering and pagination
  static async getProducts({
    limit = 50,
    offset = 0,
    filters = {}
  }: {
    limit?: number
    offset?: number
    filters?: ProductFilters
  } = {}): Promise<{ products: Product[], total: number }> {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (filters.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply service/product filter
    if (filters.isService !== undefined) {
      query = query.eq('is_service', filters.isService)
    }

    // Apply status filter
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    // Apply price range filters
    if (filters.priceMin !== undefined) {
      query = query.gte('unit_price', filters.priceMin)
    }
    if (filters.priceMax !== undefined) {
      query = query.lte('unit_price', filters.priceMax)
    }

    // Apply date filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching products: ${error.message}`)

    return {
      products: data || [],
      total: count || 0
    }
  }

  // Get product statistics
  static async getProductStats(): Promise<ProductStats> {
    const { data, error } = await supabase
      .from('products')
      .select('id, is_service, price')

    if (error) throw new Error(`Error fetching product stats: ${error.message}`)

    const products = data || []
    const total = products.length
    const services = products.filter(p => p.is_service).length
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0)

    return {
      total,
      services,
      totalValue
    }
  }

  // Create a new product
  static async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw new Error(`Error creating product: ${error.message}`)
    return data
  }

  // Update a product
  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating product: ${error.message}`)
    return data
  }

  // Check if product has related records
  static async getProductRelations(id: string): Promise<{ invoiceItems: number; quoteItems: number }> {
    const [invoiceItemsResult, quoteItemsResult] = await Promise.all([
      supabase.from('invoice_items').select('id', { count: 'exact' }).eq('product_id', id),
      supabase.from('quote_items').select('id', { count: 'exact' }).eq('product_id', id)
    ])

    return {
      invoiceItems: invoiceItemsResult.count || 0,
      quoteItems: quoteItemsResult.count || 0
    }
  }

  // Delete a product (with cascade option)
  static async deleteProduct(id: string, cascade: boolean = false): Promise<void> {
    if (cascade) {
      // Delete related records first
      await Promise.all([
        supabase.from('invoice_items').delete().eq('product_id', id),
        supabase.from('quote_items').delete().eq('product_id', id)
      ])
    } else {
      // Check for relations before deletion
      const relations = await this.getProductRelations(id)
      if (relations.invoiceItems > 0 || relations.quoteItems > 0) {
        throw new Error(`RELATIONS_EXIST:${relations.invoiceItems}:${relations.quoteItems}`)
      }
    }

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting product: ${error.message}`)
  }

  // Search products by code or description
  static async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('code')
      .limit(limit)

    if (error) throw new Error(`Error searching products: ${error.message}`)
    return data || []
  }

  // Get products by type (products vs services)
  static async getProductsByType(isService: boolean, limit: number = 50): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_service', isService)
      .eq('is_active', true)
      .order('code')
      .limit(limit)

    if (error) throw new Error(`Error fetching products by type: ${error.message}`)
    return data || []
  }

  // Get product by code
  static async getProductByCode(code: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('code', code)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Error fetching product by code: ${error.message}`)
    }
    return data
  }

  // Bulk update product statuses
  static async bulkUpdateStatus(productIds: string[], isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .in('id', productIds)

    if (error) throw new Error(`Error bulk updating product status: ${error.message}`)
  }
}
