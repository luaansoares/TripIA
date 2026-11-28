import type ptBR from "./pt-BR";

const en: typeof ptBR = {
    navigation: {
        home: "Home",
        explore: "Explore destinations",
        plan: "Plan trips",
        map: "My map",
        trips: "My trips",
        favorites: "Favorites",
        settings: "Settings",
        mainMenu: "Main menu",
        openMenu: "Open menu",
        closeMenu: "Close menu",
    },
    sidebar: {
        slogan: "Plan. Explore. Travel.",
        adventure: "Your next adventure starts here.",
        description: "Discover new places with TripIA's intelligence.",
        exploreButton: "Explore destinations",
    },
    configuracoes: {
        cabecalho: {
            titulo: "Settings",
            subtitulo: "Manage your account, preferences and experience on TripIA.",
        },
        secoes: {
            conta: {
                titulo: "My account",
                descricao: "Update your personal details and account information.",
            },
            notificacoes: {
                titulo: "Notifications",
                descricao: "Manage your alerts and updates.",
            },
            preferencias: {
                titulo: "Travel preferences",
                descricao: "Personalize your experiences.",
            },
            idioma: {
                titulo: "Language and region",
                descricao: "Language, location and currency.",
            },
            aparencia: {
                titulo: "Appearance",
                descricao: "Customize how TripIA looks.",
            },
            privacidade: {
                titulo: "Privacy and security",
                descricao: "Protection and security for your account.",
            },
            sobre: {
                titulo: "About TripIA",
                descricao: "Information about the platform.",
            },
        },
        conta: {
            carregando: "Loading account...",
            usuarioPadrao: "TripIA user",
            alterarFoto: "Change profile photo",
            escolherFoto: "Choose a photo from your gallery",
            removerFoto: "Remove photo",
            nomeCompleto: "Full name",
            email: "Email",
            telefone: "Phone (optional)",
            cidade: "City (optional)",
            cidadePlaceholder: "Teresina - PI",
            salvar: "Save changes",
            salvando: "Saving...",
            gerenciarTitulo: "Manage account",
            gerenciarDescricao: "Actions related to your TripIA account.",
            excluirTitulo: "Delete my account",
            excluirDescricao:
                "This action is permanent and will remove all your data, trips and preferences.",
            excluirBotao: "Delete account",
            modalTitulo: "Delete your account?",
            modalTexto:
                "All your data, trips and preferences will be permanently removed. This action cannot be undone.",
            cancelar: "Cancel",
            confirmarExclusao: "Yes, delete account",
            excluindo: "Deleting...",
        },
        notificacoes: {
            carregando: "Loading preferences...",
            salvar: "Save preferences",
            roteiros: {
                titulo: "Itinerary generation",
                descricao:
                    "Get notified when the artificial intelligence finishes an itinerary.",
            },
            viagens: {
                titulo: "Trip updates",
                descricao: "Get notified about your saved trips.",
            },
            novidades: {
                titulo: "TripIA news",
                descricao: "Stay up to date with new features and improvements.",
            },
        },
        preferencias: {
            carregando: "Loading your preferences...",
            salvar: "Save preferences",
            transporte: {
                titulo: "Preferred transport",
                descricao: "Choose the types of transport you usually use.",
                opcoes: {
                    carro: "Car",
                    moto: "Motorcycle",
                    onibus: "Bus",
                    publico: "Public transport",
                },
            },
            interesses: {
                titulo: "Travel interests",
                descricao: "Select all the topics that suit you.",
                opcoes: {
                    praias: "Beaches and nature",
                    historia: "History and culture",
                    gastronomia: "Food and dining",
                    aventura: "Adventure",
                    turismo: "Sightseeing and tours",
                    compras: "Shopping and entertainment",
                },
            },
            orcamento: {
                titulo: "Usual budget",
                descricao: "Which budget style do you prefer when traveling?",
                opcoes: {
                    economico: { titulo: "Budget", descricao: "Focuses on saving money." },
                    moderado: {
                        titulo: "Moderate",
                        descricao: "A balance between price and comfort.",
                    },
                    confortavel: {
                        titulo: "Comfortable",
                        descricao: "More comfort during the trip.",
                    },
                    luxo: { titulo: "Luxury", descricao: "Premium experiences." },
                },
            },
        },
        idioma: {
            carregando: "Loading settings...",
            salvar: "Save settings",
            idioma: "Language",
            moeda: "Currency",
            regiao: "Region",
            formatoData: "Date format",
            moedas: {
                BRL: "Brazilian real (BRL)",
                USD: "US dollar (USD)",
                EUR: "Euro (EUR)",
            },
            regioes: {
                BR: "Brazil",
                US: "United States",
                PT: "Portugal",
                ES: "Spain",
            },
            formatos: {
                dma: "DD/MM/YYYY",
                mda: "MM/DD/YYYY",
            },
        },
        aparencia: {
            tema: {
                titulo: "Platform theme",
                descricao:
                    "In an upcoming update you will be able to choose between light, dark or follow your device setting.",
            },
            personalizacao: {
                titulo: "Visual customization",
                descricao: "Appearance options will be organized in this section.",
            },
        },
        privacidade: {
            seguranca: {
                titulo: "Account security",
                descricao: "Manage your account protection options.",
            },
            dados: {
                titulo: "Data privacy",
                descricao:
                    "Soon you will be able to review information about your data and how it is used on the platform.",
            },
        },
        sobre: {
            plataforma: "Platform",
            ano: "Year",
            projeto: "Project",
            projetoValor: "Smart travel planning",
        },
        mensagens: {
            nomeInvalido: "The name must be between 2 and 40 characters.",
            telefoneInvalido: "Enter a valid phone number with area code.",
            contaSalva: "Changes saved successfully!",
            fotoTipo: "Choose a JPG, PNG or WebP image.",
            fotoTamanho: "The image must be 10 MB or smaller.",
            fotoAtualizada: "Profile photo updated!",
            fotoRemovida: "Photo removed.",
            notificacoesSalvas: "Preferences saved successfully!",
            preferenciasSalvas: "Travel preferences saved successfully!",
            idiomaSalvo: "Settings saved successfully!",
            erroCarregar: "Could not load the data.",
            erroSalvar: "Could not save the changes.",
            erroFoto: "Could not process the photo.",
            erroExcluir: "Could not delete the account.",
        },

        explorar: {
    etiqueta: "DISCOVER NEW PLACES",
    titulo: "Explore destinations",
    subtitulo: "Find amazing places for your next trip.",
    explorarMundo: "Explore the world",

    bannerEtiqueta: "Discover extraordinary experiences",
    bannerTitulo: "Your next destination is waiting.",
    bannerDescricao: "Explore attractions, discover new places and find inspiration for your next adventure.",

    pesquisaTitulo: "Where would you like to explore?",
    pesquisaDescricao: "Search for a city, country or tourist destination.",
    pesquisaPlaceholder: "E.g.: Paris, Rio de Janeiro, Teresina...",
    pesquisar: "Search",
    buscando: "Searching...",

    categoriasTitulo: "Explore by category",
    categoriasDescricao: "Choose the type of experience that suits you.",
    categorias: {
        praias: "Beaches",
        natureza: "Nature",
        cultura: "Culture",
        gastronomia: "Food",
    },

    mensagens: {
        pesquisaMinima: "Enter at least two letters to search.",
        erroPesquisa: "Could not search for this destination.",
        erroGenerico: "An error occurred during the search.",
        pesquisarAntes: "Search for a destination first to filter attractions.",
    },

    resultados: {
        etiqueta: "SEARCH RESULTS",
        atracoesCategoria: "attractions in this category",
        atracoesEncontradas: "attractions found",
        filtroAtivo: "Active filter:",
        limparFiltro: "Clear filter",
        ordenar: "Sort by:",
        ordemPadrao: "Default order",
        proximas: "Nearest",
        melhorAvaliadas: "Highest rated",
        atracaoTuristica: "Tourist attraction",
        classificacao: "Rating:",
        naoInformada: "Not available",
        semNome: "Unnamed attraction",
        verLocalizacao: "View location",
        nenhumaEncontrada: "No attractions found",
        semResultadosCategoria: "We couldn't find attractions classified as {categoria} among these search results. Try another category or clear the filter.",
        tentarOutroDestino: "Try searching for another destination.",
        removerFiltro: "Remove filter",
        limparPesquisa: "Clear search and return to popular destinations",
    },

    populares: {
        titulo: "Popular destinations",
        descricao: "Get inspired by suggestions for your next trip.",
        destinos: {
            paris: "Culture",
            rio: "Beaches",
            roma: "History",
        },
    },

    chamada: {
        titulo: "Found your next destination?",
        descricao: "Create a personalized itinerary with TripIA's intelligence.",
        botao: "Plan trip",
    },

    rodape: "Plan. Explore. Travel.",
},
    },
};

export default en;