/**
 * Calculates the delivery fee for an order.
 *
 * Business rules (per system_blueprint.md §7):
 * - Express (10 min):  ₹49, free above ₹999 for members
 * - Scheduled:         ₹29, free above ₹500 for members
 * - Same Day:          ₹19, free above ₹500 for members
 * - Store Pickup:      always ₹0
 * - Minimum order:     ₹500 required for delivery
 *
 * @param params.subtotal      - Cart subtotal in rupees (before fee/tax).
 * @param params.slotType      - Selected delivery slot type.
 * @param params.isMember      - Whether the customer has an active membership plan.
 * @param params.isStorePickup - Whether the customer chose store pickup.
 * @returns Object with fee (₹), optional freeDeliveryMessage, and minOrderMet flag.
 */

export type SlotType = 'Express' | 'Scheduled' | 'Same Day';

interface DeliveryFeeParams {
  subtotal: number;
  slotType: SlotType;
  isMember: boolean;
  isStorePickup: boolean;
}

const FEE_CONFIG: Record<SlotType, { base: number; memberFreeAbove: number; nonMemberFreeAbove: number }> = {
  Express:    { base: 49, memberFreeAbove: 999,      nonMemberFreeAbove: Infinity },
  Scheduled:  { base: 29, memberFreeAbove: 500,      nonMemberFreeAbove: Infinity },
  'Same Day': { base: 19, memberFreeAbove: 500,      nonMemberFreeAbove: Infinity },
};

const MIN_ORDER_VALUE = 500;

export function calculateDeliveryFee(params: DeliveryFeeParams): {
  fee: number;
  freeDeliveryMessage: string | null;
  minOrderMet: boolean;
} {
  if (params.isStorePickup) {
    return { fee: 0, freeDeliveryMessage: null, minOrderMet: true };
  }

  const minOrderMet = params.subtotal >= MIN_ORDER_VALUE;
  const config = FEE_CONFIG[params.slotType];
  const freeAbove = params.isMember ? config.memberFreeAbove : config.nonMemberFreeAbove;
  const fee = params.subtotal >= freeAbove ? 0 : config.base;
  const remainingForFree = freeAbove - params.subtotal;

  const freeDeliveryMessage =
    fee > 0 && Number.isFinite(remainingForFree) && remainingForFree > 0
      ? `Add ₹${remainingForFree} more for free delivery`
      : null;

  return { fee, freeDeliveryMessage, minOrderMet };
}
