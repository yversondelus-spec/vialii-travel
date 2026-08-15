export type ComponentPaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface ComponentPayment {
  price: number
  paid: number
  status: ComponentPaymentStatus
}

export interface Installment {
  amount: number
  dueDate: string
  status: 'pending' | 'paid'
}

export type PaymentMode = 'unpaid' | 'pay_all' | 'pay_by_component' | 'installments'

export interface PaymentPlan {
  tripId: string
  mode: PaymentMode
  transport: ComponentPayment
  accommodation: ComponentPayment
  activities: ComponentPayment
  installments?: Installment[]
  totalPrice: number
  totalPaid: number
  remaining: number
  updatedAt: string
}
