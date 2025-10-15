export interface BondInputState {
  faceValue: number;
  marketPrice: number;
  couponRate: number;
  couponFrequency: number;
  maturityDate: string;
  tdsRate: number;
}

export interface BondDetails {
  faceValue: number;
  marketPrice: number;
  couponRate: number;
  yearsToMaturity: number;
  couponFrequency: number;
}

export interface YtmResult {
  ytmPeriodic: number;
  ytmAnnual: number;
  ytmEffectiveAnnual: number;
  totalReturn: number;
  returnOnInvestment: number;
  currentYield: number;
  totalCouponPayments: number;
}

export interface PayoutDataPoint {
  payoutDate: Date;
  interest: number;
  principal: number;
}

export interface BondSearchResult {
  isin: string;
  name: string;
  faceValue: number;
  marketPrice: number;
  couponRate: number;
  couponFrequency: number;
  maturityDate: string; // YYYY-MM-DD
}

export const CouponFrequencyOptions = [
    { label: 'Annually', value: 1 },
    { label: 'Semi-Annually', value: 2 },
    { label: 'Quarterly', value: 4 },
    { label: 'Monthly', value: 12 },
];
