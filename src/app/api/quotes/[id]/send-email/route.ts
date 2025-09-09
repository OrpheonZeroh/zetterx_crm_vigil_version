import { NextRequest, NextResponse } from 'next/server'
import { QuoteService } from '@/lib/services/quote-service'
import { QuoteEmailService } from '@/lib/services/quote-email-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { recipientEmail, recipientName, customMessage } = body

    // Validate required fields
    if (!recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: 'Email y nombre del destinatario son requeridos' },
        { status: 400 }
      )
    }

    // Get the quote
    const quote = await QuoteService.getQuote(id)
    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Send the email
    const result = await QuoteEmailService.sendQuoteByEmail({
      quote,
      recipientEmail,
      recipientName,
      customMessage,
      senderName: 'ZetterX Glass & Aluminum'
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al enviar el email' },
        { status: 500 }
      )
    }

    // Update quote status to 'sent' if it was 'draft'
    if (quote.status === 'draft') {
      await QuoteService.updateQuote(id, { status: 'sent' })
    }

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada por email exitosamente',
      messageId: result.messageId
    })

  } catch (error: any) {
    console.error('Error in send quote email API:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
