import Logo from "@/components/logo";
import { signIn } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  credenciais: "Email ou senha inválidos.",
  link: "Link inválido ou expirado.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-[16px] border border-white/[.08] bg-white/[.02] p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <Logo />
          <span className="font-cinzel font-semibold text-cream text-sm tracking-[.14em]">
            CODEX - VIRAL MIND
          </span>
        </div>

        <p className="kicker text-gold mb-2">ACESSO</p>

        {error && (
          <p className="text-[13px] text-red-400/90 mb-4">
            {ERROR_MESSAGES[error] ?? "Algo deu errado. Tente novamente."}
          </p>
        )}
        <form action={signIn} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            autoFocus
            placeholder="voce@vmedialabs.com.br"
            className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-white/30 focus:border-gold/40"
          />
          <input
            type="password"
            name="password"
            required
            placeholder="Senha"
            className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-white/30 focus:border-gold/40"
          />
          <button
            type="submit"
            className="btn-gold rounded-[10px] px-5 py-2.5 text-[13px] font-medium"
          >
            Entrar
          </button>
        </form>
        <a
          href="https://adm.viralmindlabs.com/esqueci-senha"
          className="mt-4 block text-[12px] text-white/40 hover:text-white/70"
        >
          Esqueci minha senha
        </a>
      </div>
    </div>
  );
}
