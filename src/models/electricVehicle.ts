export interface ElectricVehicle {
  make: string;
  model: string;
  range: number;
  price: number;
  efficiency: number;
  singleChargeDaysPercentage?: number;
}

export interface ElectricVehicleStats extends ElectricVehicle {
  meanWeeklyCharges: number;
  totalAwayCharges: number;
}
