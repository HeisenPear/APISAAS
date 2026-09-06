export interface MedicamentApicole {
  nom: string;
  substance: string;
  delaiAttenteJours: number;
  indication: string;
}

export const MEDICAMENTS_APICOLES: MedicamentApicole[] = [
  { nom: 'Apivar', substance: 'Amitraz', delaiAttenteJours: 0, indication: 'Varroase' },
  { nom: 'Apitraz', substance: 'Amitraz', delaiAttenteJours: 0, indication: 'Varroase' },
  { nom: 'Apiguard', substance: 'Thymol', delaiAttenteJours: 0, indication: 'Varroase' },
  {
    nom: 'Apilife Var',
    substance: 'Thymol/Camphre/Eucalyptol/Menthol',
    delaiAttenteJours: 0,
    indication: 'Varroase',
  },
  { nom: 'MAQS', substance: 'Acide formique', delaiAttenteJours: 0, indication: 'Varroase' },
  {
    nom: 'VarroMed',
    substance: 'Acide oxalique/formique',
    delaiAttenteJours: 0,
    indication: 'Varroase',
  },
  { nom: 'Api-Bioxal', substance: 'Acide oxalique', delaiAttenteJours: 0, indication: 'Varroase' },
  { nom: 'Oxybee', substance: 'Acide oxalique', delaiAttenteJours: 0, indication: 'Varroase' },
  { nom: 'Polyvar Yellow', substance: 'Fluméthrine', delaiAttenteJours: 0, indication: 'Varroase' },
  { nom: 'Apistan', substance: 'Tau-fluvalinate', delaiAttenteJours: 0, indication: 'Varroase' },
  { nom: 'Tylan', substance: 'Tylosine', delaiAttenteJours: 14, indication: 'Loque américaine' },
];
