import { NextResponse } from 'next/server';

/**
 * Creates standardized error responses for payment processing
 */
export class PaymentErrorHandler {
  static invalidRequest(message: string = 'Invalid request') {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  static invalidWebhookPayload(origin: string) {
    return NextResponse.json(
      {
        error: 'Invalid webhook payload',
        redirectUrl: `${origin}/Concierge?error=invalid_payload`,
      },
      { status: 400 }
    );
  }

  static paymentNotCompleted(origin: string, paymentStatus: string, sessionStatus: string) {
    console.error('[PAYMENT ERROR] Payment not completed:', {
      paymentStatus,
      sessionStatus,
    });

    return NextResponse.json(
      {
        error: 'Payment not completed',
        redirectUrl: `${origin}/Concierge?error=payment_incomplete`,
      },
      { status: 400 }
    );
  }

  static missingReference(origin: string) {
    return NextResponse.json(
      {
        error: 'Missing reference',
        redirectUrl: `${origin}/Concierge?error=missing_reference`,
      },
      { status: 400 }
    );
  }

  static invalidReferenceFormat(origin: string) {
    return NextResponse.json(
      {
        error: 'Invalid reference format',
        redirectUrl: `${origin}/Concierge?error=invalid_reference`,
      },
      { status: 400 }
    );
  }

  static paymentSessionNotFound(origin: string) {
    return NextResponse.json(
      {
        error: 'Payment session details not found, cannot proceed.',
        redirectUrl: `${origin}/Concierge?error=session_not_found`,
      },
      { status: 404 }
    );
  }

  static assistantCreationFailed(origin: string) {
    return NextResponse.json(
      {
        error: 'Assistant creation failed',
        redirectUrl: `${origin}/Concierge?error=assistant_creation_failed`,
      },
      { status: 500 }
    );
  }

  static assistantCreationError(origin: string) {
    return NextResponse.json(
      {
        error: 'Assistant creation error',
        redirectUrl: `${origin}/Concierge?error=assistant_creation_error`,
      },
      { status: 500 }
    );
  }

  static unexpectedError(origin: string) {
    return NextResponse.json(
      {
        error: 'Processing failed',
        redirectUrl: `${origin}/Concierge?error=unexpected_error`,
      },
      { status: 500 }
    );
  }

  static success(origin: string, assistantId: string, isDefault: boolean = false) {
    const successType = isDefault ? '&type=default' : '';
    return NextResponse.json({
      message: 'Assistant created successfully',
      assistantId,
      redirectUrl: `${origin}/Concierge?success=payment_complete&assistant_created=true${successType}`,
    });
  }
}
