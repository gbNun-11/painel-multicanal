import { Orbit, Rocket, Sparkles, Star } from "lucide-react";

const NotFound = () => {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-4 p-6 text-center leading-relaxed">
      <div className="dark relative h-20 w-72 overflow-hidden mb-10">
        <Star className="star star-1 absolute size-3" />
        <Sparkles className="star star-2 absolute size-4" />
        <Star className="star star-3 absolute size-2.5" />
        <Sparkles className="star star-4 absolute size-3" />
        <Star className="star star-5 absolute size-2" />

        <div className="rocket-animation absolute left-0 top-1/2">
          <div className="relative flex items-center">
            <div className="rocket-particles absolute right-5 top-1/2">
              <span className="particle particle-1" />
              <span className="particle particle-2" />
              <span className="particle particle-3" />
              <span className="particle particle-4" />
              <span className="particle particle-5" />
              <span className="particle particle-6" />
              <span className="particle particle-7" />
            </div>
            <Rocket className="relative z-10 size-7 rotate-45" />
          </div>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="relative flex size-16 items-center justify-center">
            <Orbit className="absolute size-16 animate-[spin_3s_linear_infinite]" />

            <Orbit className="absolute size-11 animate-[spin_1.5s_linear_infinite_reverse]" />

            <div className="size-5 rounded-full bg-black shadow-[0_0_15px_5px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="scroll-m-20 border-b pb-1 text-2xl font-semibold tracking-tight first:mt-0">
          404 - Página Não Encontrada
        </h2>
      </div>

      <div className="space-y-4">
        <p>
          Ops! Parece que a página que você está tentando acessar não existe.
          Talvez ela tenha tirado férias, resolvido explorar o universo ou se
          perdido em algum lugar entre dois buracos negros. 🌌
        </p>

        <p>
          Mas calma, você não está perdido no espaço (ainda). Só lembre da
          terceira lei de Newton: para alcançar algo, é preciso deixar algo para
          trás. Então talvez seja hora de deixar essa página no passado e voltar
          para a página principal ou seguir para o histórico.
        </p>

        <p>
          Claro... você pode ficar por aqui e fingir que encontrou uma página
          secreta, acessível apenas para exploradores interdimensionais. 🧭✨
        </p>

        <p>
          Se você acha que essa página deveria existir (ou quiser conversar
          sobre viagem no tempo e buracos de minhoca), entre em contato. Caso
          contrário, use o menu e volte ao mundo real.
        </p>

        <p>
          Enquanto isso, fica a reflexão: &quot;Se uma página não existe na
          internet, será que ela existiu de verdade?&quot; 🤔💭
        </p>
      </div>
    </main>
  );
};

export default NotFound;
