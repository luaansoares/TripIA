import type ptBR from "./pt-BR";

const es: typeof ptBR = {
    navigation: {
        home: "Inicio",
        explore: "Explorar destinos",
        plan: "Planificar viajes",
        map: "Mi mapa",
        trips: "Mis viajes",
        favorites: "Favoritos",
        settings: "Configuración",
        mainMenu: "Menú principal",
        openMenu: "Abrir menú",
        closeMenu: "Cerrar menú",
    },
    sidebar: {
        slogan: "Planifica. Explora. Viaja.",
        adventure: "Tu próxima aventura comienza aquí.",
        description: "Descubre nuevos lugares con la inteligencia de TripIA.",
        exploreButton: "Explorar destinos",
    },
    configuracoes: {
        cabecalho: {
            titulo: "Configuración",
            subtitulo: "Gestiona tu cuenta, tus preferencias y la experiencia en TripIA.",
        },
        secoes: {
            conta: {
                titulo: "Mi cuenta",
                descricao: "Actualiza tus datos personales y la información de la cuenta.",
            },
            notificacoes: {
                titulo: "Notificaciones",
                descricao: "Gestiona tus avisos y actualizaciones.",
            },
            preferencias: {
                titulo: "Preferencias de viaje",
                descricao: "Personaliza tus experiencias.",
            },
            idioma: {
                titulo: "Idioma y región",
                descricao: "Idioma, ubicación y moneda.",
            },
            aparencia: {
                titulo: "Apariencia",
                descricao: "Personaliza la apariencia de TripIA.",
            },
            privacidade: {
                titulo: "Privacidad y seguridad",
                descricao: "Protección y seguridad de tu cuenta.",
            },
            sobre: {
                titulo: "Acerca de TripIA",
                descricao: "Información sobre la plataforma.",
            },
        },
        conta: {
            carregando: "Cargando cuenta...",
            usuarioPadrao: "Usuario TripIA",
            alterarFoto: "Cambiar foto de perfil",
            escolherFoto: "Elegir una foto de la galería",
            removerFoto: "Quitar foto",
            nomeCompleto: "Nombre completo",
            email: "Correo electrónico",
            telefone: "Teléfono (opcional)",
            cidade: "Ciudad (opcional)",
            cidadePlaceholder: "Teresina - PI",
            salvar: "Guardar cambios",
            salvando: "Guardando...",
            gerenciarTitulo: "Gestionar cuenta",
            gerenciarDescricao: "Acciones relacionadas con tu cuenta de TripIA.",
            excluirTitulo: "Eliminar mi cuenta",
            excluirDescricao:
                "Esta acción es permanente y eliminará todos tus datos, viajes y preferencias.",
            excluirBotao: "Eliminar cuenta",
            modalTitulo: "¿Eliminar tu cuenta?",
            modalTexto:
                "Todos tus datos, viajes y preferencias se eliminarán de forma permanente. Esta acción no se puede deshacer.",
            cancelar: "Cancelar",
            confirmarExclusao: "Sí, eliminar cuenta",
            excluindo: "Eliminando...",
        },
        notificacoes: {
            carregando: "Cargando preferencias...",
            salvar: "Guardar preferencias",
            roteiros: {
                titulo: "Generación de itinerarios",
                descricao:
                    "Recibe avisos cuando la inteligencia artificial termine un itinerario.",
            },
            viagens: {
                titulo: "Actualizaciones de viajes",
                descricao: "Recibe avisos relacionados con tus viajes guardados.",
            },
            novidades: {
                titulo: "Novedades de TripIA",
                descricao: "Entérate de nuevas funciones y mejoras de la plataforma.",
            },
        },
        preferencias: {
            carregando: "Cargando tus preferencias...",
            salvar: "Guardar preferencias",
            transporte: {
                titulo: "Transporte preferido",
                descricao: "Elige los medios de transporte que sueles utilizar.",
                opcoes: {
                    carro: "Coche",
                    moto: "Moto",
                    onibus: "Autobús",
                    publico: "Transporte público",
                },
            },
            interesses: {
                titulo: "Intereses de viaje",
                descricao: "Selecciona todos los temas que van contigo.",
                opcoes: {
                    praias: "Playas y naturaleza",
                    historia: "Historia y cultura",
                    gastronomia: "Gastronomía",
                    aventura: "Aventura",
                    turismo: "Turismo y excursiones",
                    compras: "Compras y entretenimiento",
                },
            },
            orcamento: {
                titulo: "Presupuesto habitual",
                descricao: "¿Qué estilo de presupuesto prefieres en tus viajes?",
                opcoes: {
                    economico: { titulo: "Económico", descricao: "Prioriza el ahorro." },
                    moderado: {
                        titulo: "Moderado",
                        descricao: "Equilibrio entre precio y comodidad.",
                    },
                    confortavel: {
                        titulo: "Confortable",
                        descricao: "Más comodidad durante el viaje.",
                    },
                    luxo: { titulo: "Lujo", descricao: "Experiencias premium." },
                },
            },
        },
        idioma: {
            carregando: "Cargando configuración...",
            salvar: "Guardar configuración",
            idioma: "Idioma",
            moeda: "Moneda",
            regiao: "Región",
            formatoData: "Formato de fecha",
            moedas: {
                BRL: "Real brasileño (BRL)",
                USD: "Dólar estadounidense (USD)",
                EUR: "Euro (EUR)",
            },
            regioes: {
                BR: "Brasil",
                US: "Estados Unidos",
                PT: "Portugal",
                ES: "España",
            },
            formatos: {
                dma: "DD/MM/AAAA",
                mda: "MM/DD/AAAA",
            },
        },
        aparencia: {
            tema: {
                titulo: "Tema de la plataforma",
                descricao:
                    "En una próxima etapa podrás elegir entre tema claro, oscuro o seguir la configuración del dispositivo.",
            },
            personalizacao: {
                titulo: "Personalización visual",
                descricao: "Las opciones de apariencia se organizarán en esta sección.",
            },
        },
        privacidade: {
            seguranca: {
                titulo: "Seguridad de la cuenta",
                descricao: "Gestiona las opciones de protección de tu cuenta.",
            },
            dados: {
                titulo: "Privacidad de los datos",
                descricao:
                    "Próximamente podrás consultar la información sobre tus datos y su uso en la plataforma.",
            },
        },
        sobre: {
            plataforma: "Plataforma",
            ano: "Año",
            projeto: "Proyecto",
            projetoValor: "Planificación inteligente de viajes",
        },
        mensagens: {
            nomeInvalido: "El nombre debe tener entre 2 y 40 caracteres.",
            telefoneInvalido: "Introduce un teléfono válido con prefijo.",
            contaSalva: "¡Cambios guardados con éxito!",
            fotoTipo: "Elige una imagen JPG, PNG o WebP.",
            fotoTamanho: "La imagen debe pesar como máximo 10 MB.",
            fotoAtualizada: "¡Foto de perfil actualizada!",
            fotoRemovida: "Foto eliminada.",
            notificacoesSalvas: "¡Preferencias guardadas con éxito!",
            preferenciasSalvas: "¡Preferencias de viaje guardadas con éxito!",
            idiomaSalvo: "¡Configuración guardada con éxito!",
            erroCarregar: "No se pudieron cargar los datos.",
            erroSalvar: "No se pudieron guardar los cambios.",
            erroFoto: "No se pudo procesar la foto.",
            erroExcluir: "No se pudo eliminar la cuenta.",
        },

        explorar: {
    etiqueta: "DESCUBRE NUEVOS LUGARES",
    titulo: "Explorar destinos",
    subtitulo: "Encuentra lugares increíbles para tu próximo viaje.",
    explorarMundo: "Explora el mundo",

    bannerEtiqueta: "Descubre experiencias extraordinarias",
    bannerTitulo: "Tu próximo destino te está esperando.",
    bannerDescricao: "Explora atracciones, descubre nuevos lugares y encuentra inspiración para tu próxima aventura.",

    pesquisaTitulo: "¿Dónde quieres explorar?",
    pesquisaDescricao: "Busca una ciudad, país o destino turístico.",
    pesquisaPlaceholder: "Ej.: París, Río de Janeiro, Teresina...",
    pesquisar: "Buscar",
    buscando: "Buscando...",

    categoriasTitulo: "Explora por categoría",
    categoriasDescricao: "Elige el tipo de experiencia que más te guste.",
    categorias: {
        praias: "Playas",
        natureza: "Naturaleza",
        cultura: "Cultura",
        gastronomia: "Gastronomía",
    },

    mensagens: {
        pesquisaMinima: "Introduce al menos dos letras para buscar.",
        erroPesquisa: "No se pudo buscar este destino.",
        erroGenerico: "Se produjo un error durante la búsqueda.",
        pesquisarAntes: "Primero busca un destino para filtrar las atracciones.",
    },

    resultados: {
        etiqueta: "RESULTADOS DE LA BÚSQUEDA",
        atracoesCategoria: "atracciones en esta categoría",
        atracoesEncontradas: "atracciones encontradas",
        filtroAtivo: "Filtro activo:",
        limparFiltro: "Limpiar filtro",
        ordenar: "Ordenar:",
        ordemPadrao: "Orden predeterminado",
        proximas: "Más cercanas",
        melhorAvaliadas: "Mejor valoradas",
        atracaoTuristica: "Atracción turística",
        classificacao: "Valoración:",
        naoInformada: "No disponible",
        semNome: "Atracción sin nombre",
        verLocalizacao: "Ver ubicación",
        nenhumaEncontrada: "No se encontraron atracciones",
        semResultadosCategoria: "No encontramos atracciones clasificadas como {categoria} entre los resultados. Prueba otra categoría o limpia el filtro.",
        tentarOutroDestino: "Intenta buscar otro destino.",
        removerFiltro: "Quitar filtro",
        limparPesquisa: "Limpiar búsqueda y volver a los destinos populares",
    },

    populares: {
        titulo: "Destinos populares",
        descricao: "Inspírate con algunas sugerencias para tu próximo viaje.",
        destinos: {
            paris: "Cultura",
            rio: "Playas",
            roma: "Historia",
        },
    },

    chamada: {
        titulo: "¿Encontraste tu próximo destino?",
        descricao: "Crea un itinerario personalizado con la inteligencia de TripIA.",
        botao: "Planificar viaje",
    },

    rodape: "Planifica. Explora. Viaja.",
},
    },
};

export default es;