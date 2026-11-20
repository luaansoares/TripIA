
interface UnsplashPhoto {
    id: string;
    alt_description?: string | null;
    description?: string | null;
    urls: {
        regular: string;
        small: string;
    };
    links: {
        html: string;
    };
    user: {
        name: string;
        links: {
            html: string;
        };
    };
}

interface RespostaUnsplash {
    results?: UnsplashPhoto[];
}

export interface ImagemAlternativa {
    url: string;
    titulo: string;
    autor: string;
    licenca: string;
    linkOriginal: string;
    autorUrl: string;
}

const cacheImagens = new Map<string, ImagemAlternativa | null>();

export async function buscarImagemAlternativa(
    consulta: string
): Promise<ImagemAlternativa | null> {
    const termo = consulta.trim();

    if (!termo) return null;

    const chave = termo.toLowerCase();

    if (cacheImagens.has(chave)) {
        return cacheImagens.get(chave) ?? null;
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        console.error("UNSPLASH_ACCESS_KEY não configurada.");
        return null;
    }

    try {
        const url = new URL("https://api.unsplash.com/search/photos");

        url.searchParams.set("query", termo);
        url.searchParams.set("per_page", "1");
        url.searchParams.set("orientation", "landscape");
        url.searchParams.set("content_filter", "high");

        const resposta = await fetch(url.toString(), {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
                "Accept-Version": "v1",
            },
            next: { revalidate: 86400 },
        });

        if (!resposta.ok) {
            console.error("Erro na API Unsplash:", resposta.status);
            return null;
        }

        const dados: RespostaUnsplash = await resposta.json();
        const foto = dados.results?.[0];

        if (!foto) {
            cacheImagens.set(chave, null);
            return null;
        }

        const resultado: ImagemAlternativa = {
            url: foto.urls.regular || foto.urls.small,
            titulo:
                foto.alt_description ||
                foto.description ||
                termo,
            autor: foto.user.name,
            licenca: "Unsplash",
            linkOriginal: `${foto.links.html}?utm_source=tripia&utm_medium=referral`,
            autorUrl: `${foto.user.links.html}?utm_source=tripia&utm_medium=referral`,
        };

        cacheImagens.set(chave, resultado);

        return resultado;
    } catch (error) {
        console.error("Falha na busca de imagem Unsplash:", error);
        return null;
    }
}
