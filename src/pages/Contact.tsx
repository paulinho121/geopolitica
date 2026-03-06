import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contato | GlobalPulse News</title>
        <meta name="description" content="Entre em contato com a equipe do GlobalPulse News." />
      </Helmet>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow max-w-3xl">
          <div className="mb-8 pb-4 border-b-4 border-blue-600">
            <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">
              Fale Conosco
            </h1>
            <p className="text-gray-600 mt-2">
              Tem alguma dúvida, sugestão ou pauta? Entre em contato com a nossa equipe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Informações de Contato</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">E-mail</h3>
                    <p className="text-gray-600">Redação: redacao@globalpulse.news</p>
                    <p className="text-gray-600">Comercial: comercial@globalpulse.news</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Telefone</h3>
                    <p className="text-gray-600">+55 (11) 9999-9999</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Endereço</h3>
                    <p className="text-gray-600">Av. Paulista, 1000 - Bela Vista<br />São Paulo - SP, 01310-100</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Envie uma Mensagem</h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                  <select
                    id="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Sugestão de Pauta</option>
                    <option>Dúvida</option>
                    <option>Comercial</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Escreva sua mensagem aqui..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </div>

        <Sidebar />
      </div>
    </>
  );
}
