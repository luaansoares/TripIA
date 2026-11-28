
import ptBR from "./pt-BR";
import en from "./en";
import es from "./es";

export const traducoes = {
    "pt-BR": ptBR,
    en,
    es,
};

export type Idioma = keyof typeof traducoes;

export type ChaveTraducao = keyof typeof ptBR;
