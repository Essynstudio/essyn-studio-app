import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermosPage() {
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

        <h1 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-2">Termos de Uso</h1>
        <p className="text-sm text-[var(--fg-muted)] mb-8">Última atualização: março de 2026</p>

        <div className="space-y-6 text-sm text-[var(--fg-secondary)] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">1. Aceitação dos Termos</h2>
            <p>Ao criar uma conta no Essyn Studio (&quot;Essyn&quot;, &quot;nós&quot;, &quot;nosso&quot;), acessível em essyn.studio e app.essyn.studio, você (&quot;Usuário&quot;, &quot;você&quot;) declara que leu, compreendeu e concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição aqui descrita, você não deverá utilizar a plataforma. O uso continuado do serviço após eventuais atualizações destes termos constitui aceitação das modificações.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">2. Descrição do Serviço</h2>
            <p>O Essyn Studio é uma plataforma SaaS (Software as a Service) de gestão completa para fotógrafos e estúdios de fotografia. A plataforma oferece as seguintes funcionalidades principais:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Gestão de Projetos:</strong> criação, acompanhamento e organização de ensaios, casamentos, eventos e demais trabalhos fotográficos, com fluxo de etapas personalizável.</li>
              <li><strong>CRM (Gestão de Clientes):</strong> cadastro de clientes, histórico de interações, anotações e acompanhamento de leads e oportunidades.</li>
              <li><strong>Financeiro:</strong> controle de receitas, despesas, parcelas, formas de pagamento e visão geral da saúde financeira do estúdio.</li>
              <li><strong>Galerias de Fotos:</strong> upload, organização e entrega de fotos aos clientes por meio de galerias online com seleção e download.</li>
              <li><strong>Contratos:</strong> criação, envio e assinatura digital de contratos de prestação de serviço.</li>
              <li><strong>Portal do Cliente:</strong> área exclusiva onde os clientes do fotógrafo podem acessar galerias, contratos, pagamentos e informações do projeto.</li>
              <li><strong>Iris IA:</strong> assistente de inteligência artificial integrada à plataforma para auxiliar em tarefas do dia a dia do fotógrafo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">3. Cadastro e Conta</h2>
            <p>Para utilizar o Essyn, você precisa criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você se compromete a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fornecer dados verídicos no momento do cadastro, incluindo nome, e-mail e informações do estúdio.</li>
              <li>Manter sua senha em sigilo e não compartilhá-la com terceiros. Você é o único responsável por toda atividade realizada em sua conta.</li>
              <li>Notificar imediatamente o Essyn em caso de uso não autorizado da sua conta ou qualquer violação de segurança.</li>
              <li>Manter apenas uma conta por estúdio. Cada conta representa um estúdio ou profissional individual.</li>
            </ul>
            <p className="mt-2">O Essyn não se responsabiliza por perdas ou danos decorrentes do compartilhamento de credenciais ou do não cumprimento das obrigações de segurança da conta.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">4. Planos e Pagamento</h2>
            <p>O Essyn oferece um plano Starter gratuito com funcionalidades básicas para que você conheça a plataforma. Futuramente, serão disponibilizados planos pagos com recursos adicionais, maiores limites de armazenamento e funcionalidades avançadas.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Plano Starter (gratuito):</strong> acesso às funcionalidades essenciais da plataforma, com limites de uso definidos na página de planos.</li>
              <li><strong>Planos pagos (futuros):</strong> as cobranças serão realizadas de forma recorrente (mensal ou anual), conforme o plano escolhido. Os valores e condições serão informados antes da contratação.</li>
              <li><strong>Cancelamento:</strong> você pode cancelar seu plano pago a qualquer momento. O acesso às funcionalidades do plano continuará disponível até o final do período já pago. Não realizamos reembolsos proporcionais por períodos não utilizados.</li>
              <li><strong>Alteração de preços:</strong> nos reservamos o direito de alterar os valores dos planos pagos, com aviso prévio de 30 dias por e-mail. A alteração não afeta o período já contratado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">5. Uso Aceitável</h2>
            <p>Ao utilizar o Essyn, você concorda em não:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utilizar a plataforma para enviar spam, mensagens em massa não solicitadas ou qualquer forma de comunicação abusiva.</li>
              <li>Fazer upload, armazenar ou distribuir conteúdo ilegal, difamatório, obsceno, que promova violência ou discriminação.</li>
              <li>Violar direitos de propriedade intelectual, direitos autorais, marcas registradas ou quaisquer outros direitos de terceiros.</li>
              <li>Tentar acessar áreas restritas da plataforma, contas de outros usuários ou sistemas internos do Essyn.</li>
              <li>Utilizar robôs, scrapers ou qualquer ferramenta automatizada para extrair dados da plataforma sem autorização.</li>
              <li>Revender, sublicenciar ou redistribuir o acesso ao Essyn sem autorização expressa.</li>
              <li>Utilizar a plataforma de qualquer forma que possa danificar, sobrecarregar ou prejudicar o funcionamento do serviço.</li>
            </ul>
            <p className="mt-2">O descumprimento dessas regras pode resultar em suspensão ou encerramento da conta, conforme descrito na seção 11.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">6. Propriedade Intelectual</h2>
            <p>&quot;Essyn&quot;, &quot;Essyn Studio&quot;, &quot;Iris&quot; e todos os logotipos, nomes, designs, textos e elementos visuais da plataforma são de propriedade exclusiva do Essyn Studio e estão protegidos pelas leis brasileiras de propriedade intelectual. É proibida a reprodução, cópia ou uso não autorizado de qualquer elemento da marca.</p>
            <p className="mt-2">O conteúdo que você cria, carrega ou armazena na plataforma (incluindo fotos, contratos, dados de clientes e informações financeiras) permanece integralmente de sua propriedade. Ao utilizar o Essyn, você nos concede uma licença limitada, não exclusiva e revogável para hospedar, processar e exibir esse conteúdo exclusivamente com a finalidade de prestar o serviço contratado.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">7. Armazenamento e Fotos</h2>
            <p>As fotos e arquivos enviados à plataforma são armazenados de forma segura utilizando a infraestrutura do Supabase Storage, com criptografia em trânsito e em repouso.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Limites de armazenamento:</strong> cada plano possui um limite de armazenamento definido. Ao atingir o limite, não será possível fazer novos uploads até que espaço seja liberado ou o plano seja atualizado.</li>
              <li><strong>Backup:</strong> embora mantenhamos medidas de proteção e redundância, é responsabilidade do usuário manter backups independentes de seus arquivos originais. O Essyn não se responsabiliza pela perda de arquivos em circunstâncias extraordinárias ou fora do nosso controle.</li>
              <li><strong>Exclusão:</strong> ao excluir fotos ou galerias, os arquivos são movidos para uma lixeira (soft-delete) e permanecem recuperáveis por 90 dias. Após esse período, a exclusão é permanente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">8. Iris IA (Assistente de Inteligência Artificial)</h2>
            <p>A Iris é uma assistente de inteligência artificial integrada ao Essyn, desenvolvida para ajudar fotógrafos em tarefas como redação de mensagens, sugestões de organização, análise de dados e outras funcionalidades do dia a dia profissional. Ao utilizar a Iris, você reconhece e concorda que:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>As respostas geradas pela Iris são produzidas automaticamente por modelos de linguagem e podem conter imprecisões, erros ou informações desatualizadas.</li>
              <li>A Iris não substitui aconselhamento profissional jurídico, contábil, financeiro ou de qualquer outra natureza especializada.</li>
              <li>Você é responsável por revisar e validar qualquer conteúdo gerado pela Iris antes de utilizá-lo com seus clientes ou em documentos oficiais.</li>
              <li>Os dados enviados à Iris são processados por meio da API da Anthropic para geração de respostas. Consulte nossa Política de Privacidade para mais detalhes sobre o tratamento desses dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">9. Disponibilidade do Serviço</h2>
            <p>O Essyn é fornecido como um serviço SaaS hospedado na nuvem. Nos esforçamos para manter a plataforma disponível de forma contínua, mas não garantimos disponibilidade de 100% do tempo. O serviço pode ficar temporariamente indisponível nos seguintes casos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Manutenções programadas, que serão comunicadas com antecedência sempre que possível.</li>
              <li>Atualizações de segurança ou melhorias na plataforma.</li>
              <li>Falhas em provedores de infraestrutura terceirizados (Supabase, Vercel e outros).</li>
              <li>Eventos de força maior, como desastres naturais, falhas de rede ou ataques cibernéticos.</li>
            </ul>
            <p className="mt-2">O Essyn não será responsável por perdas ou danos decorrentes de períodos de indisponibilidade do serviço.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">10. Limitação de Responsabilidade</h2>
            <p>Na máxima extensão permitida pela legislação brasileira, o Essyn Studio não será responsável por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Danos indiretos, incidentais, especiais, consequentes ou punitivos de qualquer natureza.</li>
              <li>Lucros cessantes, perda de receita, perda de dados ou interrupção de negócios.</li>
              <li>Ações ou omissões de terceiros, incluindo provedores de infraestrutura.</li>
              <li>Conteúdo gerado pela Iris IA que seja utilizado sem a devida revisão pelo usuário.</li>
              <li>Uso indevido da plataforma por parte do usuário ou de terceiros que tenham acesso às credenciais da conta.</li>
            </ul>
            <p className="mt-2">Em qualquer hipótese, a responsabilidade total do Essyn perante o usuário estará limitada ao valor efetivamente pago pelo usuário nos 12 meses anteriores ao evento que deu origem à reclamação, ou R$ 500,00 (quinhentos reais), o que for maior.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">11. Rescisão</h2>
            <p><strong>Por parte do usuário:</strong> você pode cancelar sua conta a qualquer momento diretamente nas configurações da plataforma ou entrando em contato pelo e-mail contato@essyn.studio. Ao cancelar, seus dados serão tratados conforme descrito na nossa Política de Privacidade (soft-delete de 90 dias, seguido de exclusão permanente).</p>
            <p className="mt-2"><strong>Por parte do Essyn:</strong> nos reservamos o direito de suspender ou encerrar sua conta, sem aviso prévio, nas seguintes situações:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Violação de qualquer disposição destes Termos de Uso.</li>
              <li>Uso da plataforma para atividades ilegais ou fraudulentas.</li>
              <li>Tentativas de comprometer a segurança ou estabilidade da plataforma.</li>
              <li>Inatividade prolongada da conta por período superior a 12 meses (com notificação prévia por e-mail).</li>
            </ul>
            <p className="mt-2">Em caso de encerramento por violação, o Essyn não é obrigado a fornecer acesso aos dados armazenados, embora, sempre que possível, ofereceremos um prazo para exportação.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">12. Alterações nos Termos</h2>
            <p>O Essyn pode atualizar estes Termos de Uso periodicamente para refletir mudanças no serviço, na legislação ou em nossas práticas. Em caso de alterações significativas:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enviaremos uma notificação por e-mail para o endereço cadastrado com pelo menos 30 dias de antecedência.</li>
              <li>A data de &quot;última atualização&quot; no topo desta página será atualizada.</li>
              <li>O uso continuado da plataforma após o período de aviso constitui aceitação dos novos termos.</li>
              <li>Caso não concorde com as alterações, você poderá encerrar sua conta antes que os novos termos entrem em vigor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">13. Foro e Legislação Aplicável</h2>
            <p>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede do Essyn Studio para dirimir quaisquer controvérsias ou litígios decorrentes destes termos, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
            <p className="mt-2">As partes concordam em tentar resolver eventuais disputas de forma amigável antes de recorrer ao Judiciário.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">14. Contato</h2>
            <p>Se você tiver dúvidas, sugestões ou preocupações sobre estes Termos de Uso, entre em contato conosco:</p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li><strong>Essyn Studio</strong></li>
              <li>E-mail: <a href="mailto:contato@essyn.studio" className="text-[var(--accent)] hover:underline">contato@essyn.studio</a></li>
              <li>Website: <a href="https://essyn.studio" className="text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">essyn.studio</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--fg-muted)]">© 2026 Essyn Studio. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
