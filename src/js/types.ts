export interface CindyType {
  ctype: string;
  value?: Record<string, any>;
}

export interface CindyNumber extends CindyType {
  usage?: "Angle";
  ctype: "number";
  value: {
    real: number;
    imag: number;
  };
}

export interface Nada {
  ctype: string;
}

export interface CindyList extends CindyType {
  value: Array<CindyType>
}
