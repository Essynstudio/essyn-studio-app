import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/criar-conta"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar
        </Link>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-full border-2 border-[#C2AD90]/40 flex items-center justify-center relative">
            <div className="absolute inset-[2px] rounded-full border border-[#C2AD90]/20" />
            <span className="font-[family-name:var(--font-playfair)] text-[12px] font-normal text-[#2C444D] tracking-[0.05em] relative z-10">ES</span>
          </div>
          <span className="flex items-baseline gap-[5px]">
            <span className="font-[family-name:var(--font-playfair)] text-[13px] font-semibold text-[var(--fg)] tracking-[0.12em] uppercase">ESSYN</span>
            <span className="text-[8px] text-[#A58D66] self-center">·</span>
            <span className="font-[family-name:var(--font-cormorant)] text-[11px] font-light text-[var(--fg-muted)] tracking-[0.2em] uppercase">STUDIO</span>
          </span>
        </div>

        <h1 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-2">Política de Privacidade</h1>
        <p className="text-sm text-[var(--fg-muted)] mb-8">Última atualização: março de 2026</p>

        <div className="space-y-6 text-sm text-[var(--fg-secondary)] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">1. Introdução</h2>
            <p>O Essyn Studio (&quot;Essyn&quot;, &quot;nós&quot;, &quot;nosso&quot;) está comprometido com a proteção da sua privacidade e dos seus dados pessoais. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as informações dos usuários da plataforma, acessível em essyn.studio e app.essyn.studio.</p>
            <p className="mt-2">Esta política foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e demais legislações brasileiras aplicáveis. Ao utilizar o Essyn, você declara estar ciente e de acordo com as práticas aqui descritas.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">2. Dados que Coletamos</h2>
            <p>Coletamos diferentes tipos de dados dependendo da sua interação com a plataforma:</p>
            <p className="mt-2"><strong>Dados fornecidos por você:</strong></p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Dados pessoais:</strong> nome completo, endereço de e-mail, número de telefone, cidade, estado e perfil do Instagram.</li>
              <li><strong>Dados do estúdio:</strong> nome do estúdio, tipo de fotografia, informações de branding e configurações do portal do cliente.</li>
              <li><strong>Conteúdo do usuário:</strong> fotos, galerias, contratos, dados de clientes, informações de projetos e registros financeiros (receitas, despesas, parcelas).</li>
              <li><strong>Documentos:</strong> contratos assinados digitalmente e demais documentos anexados aos projetos.</li>
            </ul>
            <p className="mt-2"><strong>Dados coletados automaticamente:</strong></p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Dados de uso da plataforma (páginas visitadas, funcionalidades utilizadas, frequência de acesso).</li>
              <li>Informações do dispositivo e navegador (tipo, versão, sistema operacional).</li>
              <li>Endereço IP e dados de geolocalização aproximada.</li>
              <li>Dados de autenticação e sessão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">3. Como Usamos Seus Dados</h2>
            <p>Utilizamos os dados coletados para as seguintes finalidades:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Prestação do serviço:</strong> operar a plataforma, processar seus projetos, galerias, contratos e informações financeiras.</li>
              <li><strong>Comunicação:</strong> enviar notificações sobre sua conta, atualizações do serviço, alertas de projetos e comunicações transacionais.</li>
              <li><strong>Melhoria do produto:</strong> analisar padrões de uso para aprimorar funcionalidades, corrigir problemas e desenvolver novos recursos.</li>
              <li><strong>Analytics:</strong> gerar dados agregados e anonimizados para entender como a plataforma é utilizada, sem identificar usuários individualmente.</li>
              <li><strong>Segurança:</strong> detectar e prevenir fraudes, abusos e atividades não autorizadas.</li>
              <li><strong>Obrigações legais:</strong> cumprir exigências legais, regulatórias ou judiciais aplicáveis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">4. Iris IA e Processamento de Dados</h2>
            <p>A Iris é a assistente de inteligência artificial integrada ao Essyn. Ao interagir com a Iris, seus dados são tratados da seguinte forma:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>As mensagens enviadas à Iris e o contexto necessário para gerar respostas (como dados de projetos ou clientes relevantes) são processados por meio da API da Anthropic, empresa responsável pelo modelo de linguagem utilizado.</li>
              <li>Não armazenamos permanentemente o conteúdo das conversas com a Iris. As interações são processadas em tempo real e não são mantidas em nossos servidores após a sessão.</li>
              <li>A Anthropic, conforme sua própria política, não utiliza os dados enviados via API para treinar seus modelos.</li>
              <li>Recomendamos que você não compartilhe dados sensíveis desnecessários nas conversas com a Iris, como senhas, dados bancários completos ou informações pessoais de natureza íntima.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">5. Compartilhamento de Dados</h2>
            <p><strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong> Seus dados podem ser compartilhados apenas com os seguintes provedores de infraestrutura, estritamente necessários para a operação do serviço:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Supabase:</strong> banco de dados, autenticação e armazenamento de arquivos (fotos, documentos). Dados hospedados com criptografia.</li>
              <li><strong>Vercel:</strong> hospedagem da aplicação web e funções serverless.</li>
              <li><strong>Anthropic:</strong> processamento de linguagem natural para a assistente Iris IA, via API.</li>
              <li><strong>Provedor SMTP:</strong> envio de e-mails transacionais (confirmações, notificações, convites, redefinição de senha).</li>
            </ul>
            <p className="mt-2">Todos os provedores foram selecionados por suas práticas de segurança e privacidade, e estão sujeitos a acordos de processamento de dados. Também podemos compartilhar dados quando exigido por lei, ordem judicial ou autoridade regulatória competente.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">6. Portal do Cliente</h2>
            <p>O Essyn oferece um Portal do Cliente, onde os clientes do fotógrafo podem acessar informações relacionadas ao seu projeto. Ao utilizar o Portal do Cliente, os seguintes dados podem ser compartilhados com os clientes finais:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Galerias de fotos para visualização, seleção e download.</li>
              <li>Contratos para leitura e assinatura digital.</li>
              <li>Informações de pagamento, parcelas e status financeiro do projeto.</li>
              <li>Dados gerais do projeto (datas, etapas, observações que o fotógrafo optar por compartilhar).</li>
            </ul>
            <p className="mt-2">O fotógrafo é o responsável (controlador) pelos dados de seus próprios clientes que são inseridos na plataforma. O Essyn atua como operador desses dados, processando-os exclusivamente conforme as instruções do fotógrafo e para a finalidade de prestação do serviço.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">7. Integração com Google Calendar</h2>
            <p>O Essyn Studio oferece integração opcional com o Google Calendar. Quando você conecta sua conta Google:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Dados acessados:</strong> acessamos apenas eventos de calendário relacionados às suas sessões fotográficas. Não acessamos e-mails, contatos, arquivos ou qualquer outro dado da sua conta Google.</li>
              <li><strong>Finalidade exclusiva:</strong> os dados do Google Calendar são usados exclusivamente para criar, editar e sincronizar agendamentos dentro do Essyn Studio.</li>
              <li><strong>Não compartilhamos:</strong> informações obtidas via Google Calendar nunca são compartilhadas com terceiros nem usadas para publicidade.</li>
              <li><strong>Revogação:</strong> você pode revogar o acesso a qualquer momento em <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#A58D66] underline">myaccount.google.com/permissions</a> ou nas Integrações do Essyn Studio.</li>
            </ul>
            <p className="mt-2">
              O uso das APIs do Google está em conformidade com a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#A58D66] underline">Política de Dados de Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado (<em>Limited Use</em>).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">8. Cookies</h2>
            <p>O Essyn utiliza cookies essenciais para o funcionamento da plataforma:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Cookies de autenticação:</strong> mantêm sua sessão ativa enquanto você utiliza a plataforma, para que não seja necessário fazer login a cada acesso.</li>
              <li><strong>Cookies de preferências:</strong> armazenam configurações como modo escuro/claro, idioma e outras preferências de interface.</li>
              <li><strong>Cookies do Portal do Cliente:</strong> gerenciam a sessão e autenticação dos clientes finais que acessam o portal.</li>
            </ul>
            <p className="mt-2">Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros. Não utilizamos pixels de rastreamento de redes sociais.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">9. Segurança</h2>
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Criptografia:</strong> todos os dados trafegam com criptografia TLS (em trânsito) e são armazenados com criptografia em repouso.</li>
              <li><strong>Row Level Security (RLS):</strong> políticas de segurança a nível de linha no banco de dados garantem que cada usuário acesse apenas seus próprios dados.</li>
              <li><strong>Soft-delete:</strong> registros excluídos são marcados como inativos antes da remoção definitiva, prevenindo perdas acidentais.</li>
              <li><strong>Rate limiting:</strong> mecanismos de limitação de requisições protegem contra abusos e ataques de força bruta.</li>
              <li><strong>Autenticação segura:</strong> senhas são armazenadas com hash seguro, e oferecemos autenticação via provedor OAuth (Google).</li>
            </ul>
            <p className="mt-2">Apesar de nossos esforços, nenhum sistema é completamente invulnerável. Caso identifiquemos qualquer incidente de segurança que possa afetar seus dados, notificaremos você e as autoridades competentes conforme exigido pela LGPD.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">10. Retenção de Dados</h2>
            <p>Seus dados são tratados da seguinte forma quanto à retenção:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Conta ativa:</strong> seus dados são mantidos enquanto sua conta estiver ativa e o serviço estiver sendo utilizado.</li>
              <li><strong>Exclusão de dados (soft-delete):</strong> ao excluir registros (projetos, clientes, fotos), eles permanecem em estado de soft-delete por 90 dias, podendo ser recuperados nesse período. Após 90 dias, a exclusão é permanente.</li>
              <li><strong>Cancelamento de conta:</strong> ao solicitar o cancelamento da conta, seus dados entram em período de retenção de 90 dias (para possível reativação) e são permanentemente excluídos após esse prazo.</li>
              <li><strong>Exclusão imediata:</strong> você pode solicitar a exclusão permanente e imediata de todos os seus dados a qualquer momento, entrando em contato pelo e-mail contato@essyn.studio. Atenderemos a solicitação em até 15 dias úteis.</li>
              <li><strong>Exceções:</strong> dados podem ser retidos por períodos maiores quando exigido por obrigações legais, fiscais ou regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">11. Seus Direitos (LGPD)</h2>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos em relação aos seus dados pessoais:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Acesso:</strong> solicitar uma cópia de todos os dados pessoais que mantemos sobre você.</li>
              <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Exclusão:</strong> solicitar a eliminação dos seus dados pessoais, respeitadas as exceções legais.</li>
              <li><strong>Portabilidade:</strong> solicitar a transferência dos seus dados para outro fornecedor de serviço, em formato estruturado e legível por máquina.</li>
              <li><strong>Revogação de consentimento:</strong> retirar seu consentimento para o tratamento de dados a qualquer momento, sem prejuízo da legalidade do tratamento realizado anteriormente.</li>
              <li><strong>Informação:</strong> ser informado sobre as entidades com as quais seus dados são compartilhados.</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento de dados quando realizado com base em hipóteses que não o consentimento e houver descumprimento da LGPD.</li>
            </ul>
            <p className="mt-2">Para exercer qualquer um desses direitos, entre em contato pelo e-mail <a href="mailto:contato@essyn.studio" className="text-[var(--accent)] hover:underline">contato@essyn.studio</a>. Responderemos à sua solicitação em até 15 dias úteis.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">11. Menores de Idade</h2>
            <p>O Essyn Studio é um serviço destinado exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade. Se tomarmos conhecimento de que dados de um menor foram coletados inadvertidamente, tomaremos as medidas necessárias para excluí-los imediatamente. Caso você identifique que um menor forneceu dados pessoais à plataforma, entre em contato conosco.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">12. Alterações nesta Política</h2>
            <p>Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas, no serviço ou na legislação aplicável. Em caso de alterações relevantes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enviaremos uma notificação por e-mail para o endereço cadastrado.</li>
              <li>A data de &quot;última atualização&quot; no topo desta página será atualizada.</li>
              <li>Recomendamos que você revise esta política periodicamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">14. Contato</h2>
            <p>Para dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento dos seus dados pessoais, entre em contato:</p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li><strong>Essyn Studio</strong></li>
              <li>E-mail: <a href="mailto:contato@essyn.studio" className="text-[var(--accent)] hover:underline">contato@essyn.studio</a></li>
              <li>Website: <a href="https://essyn.studio" className="text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">essyn.studio</a></li>
            </ul>
            <p className="mt-2">Se você não estiver satisfeito com nossa resposta, tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--fg-muted)]">© 2026 Essyn Studio. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
