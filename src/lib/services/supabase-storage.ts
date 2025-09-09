import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración S3 para Supabase Storage
const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_STORAGE_ENDPOINT!,
  region: process.env.SUPABASE_STORAGE_REGION!,
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Requerido para Supabase
});

export class SupabaseStorageService {
  private readonly bucketName = 'invoices'; // Bucket para facturas

  /**
   * Sube un PDF de factura al bucket de Supabase
   */
  async uploadInvoicePDF(
    invoiceId: string,
    invoiceNumber: string,
    pdfBuffer: Buffer,
    contentType: string = 'application/pdf'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileName = `pdfs/${invoiceId}/${invoiceNumber}.pdf`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: contentType,
        Metadata: {
          'invoice-id': invoiceId,
          'invoice-number': invoiceNumber,
          'uploaded-at': new Date().toISOString(),
        },
      });

      await s3Client.send(command);
      
      // Generar URL pública
      const publicUrl = `${process.env.SUPABASE_STORAGE_ENDPOINT}/${this.bucketName}/${fileName}`;
      
      console.log('✅ PDF uploaded to Supabase Storage:', publicUrl);
      
      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('❌ Error uploading PDF to Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Sube el XML de la factura al bucket
   */
  async uploadInvoiceXML(
    invoiceId: string,
    invoiceNumber: string,
    xmlContent: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileName = `xml/${invoiceId}/${invoiceNumber}.xml`;
      const xmlBuffer = Buffer.from(xmlContent, 'utf-8');
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: xmlBuffer,
        ContentType: 'application/xml',
        Metadata: {
          'invoice-id': invoiceId,
          'invoice-number': invoiceNumber,
          'type': 'dgi-xml',
          'uploaded-at': new Date().toISOString(),
        },
      });

      await s3Client.send(command);
      
      const publicUrl = `${process.env.SUPABASE_STORAGE_ENDPOINT}/${this.bucketName}/${fileName}`;
      
      console.log('✅ XML uploaded to Supabase Storage:', publicUrl);
      
      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('❌ Error uploading XML to Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Obtiene un PDF desde el storage
   */
  async getInvoicePDF(invoiceId: string, invoiceNumber: string): Promise<Buffer | null> {
    try {
      const fileName = `pdfs/${invoiceId}/${invoiceNumber}.pdf`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const response = await s3Client.send(command);
      
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        return Buffer.concat(chunks);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error downloading PDF from Supabase:', error);
      return null;
    }
  }

  /**
   * Genera URL firmada para descarga temporal (24 horas)
   */
  async getSignedDownloadUrl(
    invoiceId: string,
    invoiceNumber: string,
    fileType: 'pdf' | 'xml' = 'pdf'
  ): Promise<string | null> {
    try {
      const fileName = `${fileType}s/${invoiceId}/${invoiceNumber}.${fileType}`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 24 * 60 * 60 // 24 horas
      });
      
      return signedUrl;
    } catch (error) {
      console.error(`❌ Error generating signed URL for ${fileType}:`, error);
      return null;
    }
  }

  /**
   * Lista todos los archivos de una factura
   */
  async listInvoiceFiles(invoiceId: string): Promise<{
    pdfs: string[];
    xmls: string[];
  }> {
    // Implementación simplificada - en producción usarías ListObjectsV2Command
    return {
      pdfs: [],
      xmls: []
    };
  }
}

export const supabaseStorage = new SupabaseStorageService();
