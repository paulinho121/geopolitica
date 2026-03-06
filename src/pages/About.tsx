import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';

export default function About() {
  return (
    <>
      <Helmet>
        <title>Sobre Nós | GlobalPulse News</title>
        <meta name="description" content="Conheça a história, missão e valores do GlobalPulse News." />
      </Helmet>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow max-w-3xl">
          <div className="mb-8 pb-4 border-b-4 border-blue-600">
            <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">
              Sobre o GlobalPulse News
            </h1>
          </div>

          <div className="prose prose-lg prose-blue max-w-none font-serif text-gray-800 leading-relaxed">
            <p>
              O <strong>GlobalPulse News</strong> nasceu com a missão de oferecer um jornalismo internacional de alta qualidade, focado em trazer contexto e análise profunda para os eventos que moldam o nosso mundo.
            </p>
            
            <h2>Nossa Missão</h2>
            <p>
              Acreditamos que a informação é a base de uma sociedade livre e democrática. Nossa missão é fornecer notícias precisas, imparciais e relevantes, capacitando nossos leitores a compreenderem as complexidades da geopolítica, economia, tecnologia e sociedade global.
            </p>

            <h2>Nossos Valores</h2>
            <ul>
              <li><strong>Imparcialidade:</strong> Buscamos sempre apresentar diferentes perspectivas sobre os fatos, permitindo que o leitor forme sua própria opinião.</li>
              <li><strong>Rigor Jornalístico:</strong> Verificamos rigorosamente todas as informações antes da publicação, combatendo a desinformação.</li>
              <li><strong>Independência:</strong> Não possuímos vínculos políticos ou partidários, garantindo a liberdade editorial de nossa equipe.</li>
              <li><strong>Transparência:</strong> Somos transparentes sobre nossas fontes e métodos de apuração.</li>
            </ul>

            <h2>Nossa Equipe</h2>
            <p>
              Contamos com uma rede global de correspondentes, analistas e especialistas dedicados a trazer as notícias mais importantes de cada região do planeta, sempre com o compromisso de oferecer o melhor conteúdo para você.
            </p>
          </div>
        </div>

        <Sidebar />
      </div>
    </>
  );
}
