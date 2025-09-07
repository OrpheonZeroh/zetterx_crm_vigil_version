'use client'


export interface DGIInvoiceData {
  cufe: string
  numeroFactura: string
  fechaEmision: string
  protocoloAutorizacion: string
  urlQR: string
  urlConsulta: string
  estado: {
    codigo: string
    mensaje: string
  }
  emisor: {
    ruc: string
    nombre: string
    direccion: string
    telefono: string
    email?: string
  }
  cliente: {
    nombre: string
    direccion: string
    telefono: string
    email: string
    tipoDocumento: string
  }
  items: Array<{
    seccion: string
    descripcion: string
    codigo: string
    cantidad: number
    precioUnitario: number
    descuento: number
    total: number
    itbms: number
  }>
  totales: {
    subtotal: number
    descuentoTotal: number
    itbmsTotal: number
    total: number
    totalRecibido: number
    numeroItems: number
  }
  formaPago: {
    tipo: string
    valor: number
  }
}

export class DGIProcessorService {
  /**
   * Procesa la respuesta completa del DGI-FEP
   */
  static processDGIResponse(response: any): DGIInvoiceData | null {
    try {
      const data = response.Data?.[0]
      if (!data) throw new Error('No data found in response')

      const xmlString = data.LoteFE?.[0]?.Xml
      if (!xmlString) throw new Error('No XML found in response')

      const protocolData = data.xProtFe?.[0]?.rProtFe
      const resProc = data.gResProc

      return {
        cufe: data.urlCufe ? this.extractCUFEFromURL(data.urlCufe) : '',
        numeroFactura: this.extractFromXML(xmlString, 'dNroDF'),
        fechaEmision: this.extractFromXML(xmlString, 'dFechaEm'),
        protocoloAutorizacion: protocolData?.gInfProt?.dProtAut || '',
        urlQR: data.urlCufe || '',
        urlConsulta: data.urlCufeAlternative || '',
        estado: {
          codigo: resProc?.dCodRes || '',
          mensaje: resProc?.dMsgRes || ''
        },
        emisor: this.extractEmisorData(xmlString),
        cliente: this.extractClienteData(xmlString),
        items: this.extractItemsData(xmlString),
        totales: this.extractTotalesData(xmlString),
        formaPago: this.extractFormaPagoData(xmlString)
      }
    } catch (error) {
      console.error('Error processing DGI response:', error)
      return null
    }
  }

  /**
   * Extrae CUFE de la URL de QR
   */
  private static extractCUFEFromURL(url: string): string {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1])
      return urlParams.get('chFE') || ''
    } catch {
      return ''
    }
  }

  /**
   * Extrae un valor específico del XML
   */
  private static extractFromXML(xmlString: string, tagName: string): string {
    try {
      const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 'i')
      const match = xmlString.match(regex)
      return match ? match[1] : ''
    } catch {
      return ''
    }
  }

  /**
   * Extrae datos del emisor del XML
   */
  private static extractEmisorData(xmlString: string): DGIInvoiceData['emisor'] {
    return {
      ruc: this.extractFromXML(xmlString, 'dRuc'),
      nombre: this.extractFromXML(xmlString, 'dNombEm'),
      direccion: this.extractFromXML(xmlString, 'dDirecEm'),
      telefono: this.extractFromXML(xmlString, 'dTfnEm'),
      email: this.extractFromXML(xmlString, 'dCorElectEm') || undefined
    }
  }

  /**
   * Extrae datos del cliente del XML
   */
  private static extractClienteData(xmlString: string): DGIInvoiceData['cliente'] {
    return {
      nombre: this.extractFromXML(xmlString, 'dNombRec'),
      direccion: this.extractFromXML(xmlString, 'dDirecRec'),
      telefono: this.extractFromXML(xmlString, 'dTfnRec'),
      email: this.extractFromXML(xmlString, 'dCorElectRec'),
      tipoDocumento: this.extractFromXML(xmlString, 'iTipoRec')
    }
  }

  /**
   * Extrae items del XML (simplificado para un item)
   */
  private static extractItemsData(xmlString: string): DGIInvoiceData['items'] {
    try {
      // Por simplicidad, extraemos el primer item
      // En producción se debería parsear todos los items del XML
      return [{
        seccion: this.extractFromXML(xmlString, 'dSecItem'),
        descripcion: this.extractFromXML(xmlString, 'dDescProd'),
        codigo: this.extractFromXML(xmlString, 'dCodProd'),
        cantidad: parseFloat(this.extractFromXML(xmlString, 'dCantCodInt') || '0'),
        precioUnitario: parseFloat(this.extractFromXML(xmlString, 'dPrUnit') || '0'),
        descuento: parseFloat(this.extractFromXML(xmlString, 'dPrUnitDesc') || '0'),
        total: parseFloat(this.extractFromXML(xmlString, 'dValTotItem') || '0'),
        itbms: parseFloat(this.extractFromXML(xmlString, 'dValITBMS') || '0')
      }]
    } catch {
      return []
    }
  }

  /**
   * Extrae totales del XML
   */
  private static extractTotalesData(xmlString: string): DGIInvoiceData['totales'] {
    return {
      subtotal: parseFloat(this.extractFromXML(xmlString, 'dTotNeto') || '0'),
      descuentoTotal: parseFloat(this.extractFromXML(xmlString, 'dTotDesc') || '0'),
      itbmsTotal: parseFloat(this.extractFromXML(xmlString, 'dTotITBMS') || '0'),
      total: parseFloat(this.extractFromXML(xmlString, 'dVTot') || '0'),
      totalRecibido: parseFloat(this.extractFromXML(xmlString, 'dTotRec') || '0'),
      numeroItems: parseInt(this.extractFromXML(xmlString, 'dNroItems') || '0')
    }
  }

  /**
   * Extrae forma de pago del XML
   */
  private static extractFormaPagoData(xmlString: string): DGIInvoiceData['formaPago'] {
    return {
      tipo: this.extractFromXML(xmlString, 'iFormaPago'),
      valor: parseFloat(this.extractFromXML(xmlString, 'dVlrCuota') || '0')
    }
  }

  /**
   * Valida si una factura fue autorizada
   */
  static isInvoiceAuthorized(processedData: DGIInvoiceData): boolean {
    return processedData.estado.codigo === '0260'
  }

  /**
   * Formatea la fecha de emisión
   */
  static formatEmissionDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }
}
