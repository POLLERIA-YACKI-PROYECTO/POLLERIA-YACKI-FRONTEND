export interface Mesa {
  numero: number;
  ocupada: boolean;
  cliente?: string;
  pedido?: string;
  total?: number;
  horaInicio?: Date;
}

export interface EstadoMesa {
  [key: number]: {
    ocupada: boolean;
    cliente?: string;
    pedido?: string;
    total?: number;
    horaInicio?: Date;
  };
}