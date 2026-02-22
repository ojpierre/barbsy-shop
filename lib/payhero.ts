// PayHero API Integration for Barbsy
// Supports STK Push (M-PESA) and payment status checking

const PAYHERO_BASE_URL =
  process.env.PAYHERO_ENVIRONMENT === "sandbox"
    ? "https://backend.payhero.co.ke/api/v2/payments"
    : "https://backend.payhero.co.ke/api/v2/payments"

function getAuthHeader() {
  const username = process.env.PAYHERO_API_USERNAME!
  const password = process.env.PAYHERO_API_PASSWORD!
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
}

export interface PayHeroSTKRequest {
  amount: number
  phone_number: string
  channel_id: number
  provider: string
  external_reference: string
  callback_url: string
  customer_name?: string
}

export interface PayHeroResponse {
  success: boolean
  message?: string
  data?: any
  reference?: string
}

/**
 * Initiate an STK Push payment via PayHero
 */
export async function initiateSTKPush(params: {
  amount: number
  phone: string
  orderId: string
  customerName?: string
}): Promise<PayHeroResponse> {
  try {
    const payload: PayHeroSTKRequest = {
      amount: params.amount,
      phone_number: params.phone,
      channel_id: Number(process.env.PAYHERO_CHANNEL_ID) || 1114,
      provider: "m-pesa",
      external_reference: params.orderId,
      callback_url: process.env.PAYHERO_CALLBACK_URL!,
      customer_name: params.customerName,
    }

    const response = await fetch(PAYHERO_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, data, reference: data.reference }
    }

    return { success: false, message: data.message || "Payment initiation failed" }
  } catch (error) {
    console.error("PayHero STK Push error:", error)
    return { success: false, message: "Failed to connect to payment provider" }
  }
}

/**
 * Check the status of a PayHero transaction
 */
export async function checkPaymentStatus(reference: string): Promise<PayHeroResponse> {
  try {
    const response = await fetch(`${PAYHERO_BASE_URL}/${reference}`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, data }
    }

    return { success: false, message: data.message || "Status check failed" }
  } catch (error) {
    console.error("PayHero status check error:", error)
    return { success: false, message: "Failed to check payment status" }
  }
}
