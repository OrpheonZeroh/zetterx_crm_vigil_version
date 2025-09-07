import type { Customer } from '@/lib/services/customer-service'

export function exportToCSV(customers: Customer[], filename: string = 'clientes') {
  // Define headers
  const headers = [
    'Nombre',
    'Email',
    'Teléfono',
    'Dirección',
    'Provincia',
    'Distrito',
    'Corregimiento',
    'Tipo ID',
    'Notas',
    'Fecha Creación'
  ]

  // Convert customers to CSV rows
  const rows = customers.map(customer => [
    customer.name || '',
    customer.email || '',
    customer.phone || '',
    customer.address_line || '',
    customer.province || '',
    customer.district || '',
    customer.corregimiento || '',
    customer.tax_id_type || '',
    customer.notes || '',
    customer.created_at ? new Date(customer.created_at).toLocaleDateString('es-PA') : ''
  ])

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToJSON(customers: Customer[], filename: string = 'clientes') {
  const jsonContent = JSON.stringify(customers, null, 2)
  
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToPDF(customers: Customer[], filename: string = 'clientes') {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Lista de Clientes - ZetterX CRM</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1e40af; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ZetterX CRM - Lista de Clientes</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-PA')}</p>
        <p>Total de clientes: ${customers.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Provincia</th>
            <th>Distrito</th>
            <th>Fecha Creación</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(customer => `
            <tr>
              <td>${customer.name || ''}</td>
              <td>${customer.email || ''}</td>
              <td>${customer.phone || ''}</td>
              <td>${customer.province || ''}</td>
              <td>${customer.district || ''}</td>
              <td>${customer.created_at ? new Date(customer.created_at).toLocaleDateString('es-PA') : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>ZetterX CRM © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `

  // Create and download HTML file (can be opened in browser and printed as PDF)
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
