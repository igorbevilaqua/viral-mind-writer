import Logo from "@/components/logo";
import { sendMagicLink } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  send: "Não foi possível enviar o link. Tente novamente em instantes.",
  link: "Link inválido ou expirado. Peça um novo abaixo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-[16px] border border-white/[.08] bg-white/[.02] p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <Logo />
          <span className="font-cinzel font-semibold text-cream text-sm tracking-[.14em]">
            VIRAL MIND
          </span>
        </div>

        <p className="kicker text-gold mb-2">ACESSO</p>

        {sent ? (
          <p className="text-[13px] leading-relaxed text-white/70">
            Se o email tiver acesso, um link de entrada foi enviado. Confira sua caixa de
            entrada e abra o link neste navegador.
          </p>
        ) : (
          <>
            <p className="text-[13px] leading-relaxed text-white/55 mb-5">
              Informe seu email para receber um link mágico de acesso.
            </p>
            {error && (
              <p className="text-[13px] text-red-400/90 mb-4">
                {ERROR_MESSAGES[error] ?? "Algo deu errado. Tente novamente."}
              </p>
            )}
            <form action={sendMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="voce@vmedialabs.com.br"
                className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-white/30 focus:border-gold/40"
              />
              <button
                type="submit"
                className="btn-gold rounded-[10px] px-5 py-2.5 text-[13px] font-medium"
              >
                Enviar link de acesso
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
