/**
 * DESIGN SYSTEM EXAMPLE - RAIZ EDUCAÇÃO
 *
 * Este componente demonstra todos os elementos do Design System.
 * Use-o como referência visual e de código ao criar novos componentes.
 *
 * Para visualizar: Adicione este componente em uma rota ou view temporária
 */

import React, { useState } from 'react';
import {
  Check,
  X,
  AlertCircle,
  Info,
  Save,
  Download,
  Upload,
  Edit2,
  Trash2,
  User,
  Mail,
  Lock,
  Search,
  Bell
} from 'lucide-react';

const DesignSystemExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-2)'
        }}>
          Design System - Raiz Educação
        </h1>
        <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-md)' }}>
          Guia visual de todos os componentes disponíveis no sistema
        </p>
      </div>

      {/* ========================================
          CORES
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          1. Paleta de Cores
        </h2>

        {/* Cores Primárias */}
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-3)' }}>
          Primárias (Laranja)
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap' }}>
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map(shade => (
            <div key={shade} style={{ flex: '1', minWidth: '80px' }}>
              <div style={{
                backgroundColor: `var(--color-primary-${shade})`,
                height: '80px',
                borderRadius: 'var(--radius-default)',
                marginBottom: 'var(--spacing-1)',
                border: '1px solid var(--color-gray-200)'
              }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-600)', textAlign: 'center' }}>
                {shade}
              </div>
            </div>
          ))}
        </div>

        {/* Cores Secundárias */}
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-3)' }}>
          Secundárias (Turquesa)
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap' }}>
          {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map(shade => (
            <div key={shade} style={{ flex: '1', minWidth: '80px' }}>
              <div style={{
                backgroundColor: `var(--color-secondary-${shade})`,
                height: '80px',
                borderRadius: 'var(--radius-default)',
                marginBottom: 'var(--spacing-1)',
                border: '1px solid var(--color-gray-200)'
              }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-600)', textAlign: 'center' }}>
                {shade}
              </div>
            </div>
          ))}
        </div>

        {/* Cores de Status */}
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-3)' }}>
          Status
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <div style={{
              backgroundColor: 'var(--color-success-500)',
              height: '60px',
              borderRadius: 'var(--radius-default)',
              marginBottom: 'var(--spacing-1)'
            }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-700)', fontWeight: 'var(--font-medium)' }}>
              Sucesso
            </div>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <div style={{
              backgroundColor: 'var(--color-error-500)',
              height: '60px',
              borderRadius: 'var(--radius-default)',
              marginBottom: 'var(--spacing-1)'
            }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-700)', fontWeight: 'var(--font-medium)' }}>
              Erro
            </div>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <div style={{
              backgroundColor: 'var(--color-warning-500)',
              height: '60px',
              borderRadius: 'var(--radius-default)',
              marginBottom: 'var(--spacing-1)'
            }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-700)', fontWeight: 'var(--font-medium)' }}>
              Aviso
            </div>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <div style={{
              backgroundColor: 'var(--color-info-500)',
              height: '60px',
              borderRadius: 'var(--radius-default)',
              marginBottom: 'var(--spacing-1)'
            }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-700)', fontWeight: 'var(--font-medium)' }}>
              Info
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          BOTÕES
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          2. Botões
        </h2>

        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', marginBottom: 'var(--spacing-4)' }}>
          {/* Botão Primário */}
          <button className="btn-primary">
            <Save size={16} />
            Botão Primário
          </button>

          {/* Botão Secundário */}
          <button className="btn-secondary">
            <Download size={16} />
            Botão Secundário
          </button>

          {/* Botão Desabilitado */}
          <button className="btn-primary" disabled>
            <Upload size={16} />
            Desabilitado
          </button>
        </div>

        {/* Tamanhos */}
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-3)' }}>
          Tamanhos
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{
            padding: '6px 16px',
            fontSize: 'var(--text-base)',
            backgroundColor: 'var(--color-primary-500)',
            color: 'var(--color-white)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-semibold)',
            cursor: 'pointer'
          }}>
            Pequeno
          </button>
          <button className="btn-primary">
            Médio (Padrão)
          </button>
          <button style={{
            padding: '12px 32px',
            fontSize: 'var(--text-lg)',
            backgroundColor: 'var(--color-primary-500)',
            color: 'var(--color-white)',
            border: 'none',
            borderRadius: 'var(--radius-default)',
            fontWeight: 'var(--font-semibold)',
            cursor: 'pointer'
          }}>
            Grande
          </button>
        </div>
      </section>

      {/* ========================================
          CARDS
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          3. Cards
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
          {/* Card Padrão */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-2)' }}>
              Card Padrão
            </h3>
            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)' }}>
              Este é um card padrão com hover effect. Passe o mouse para ver a animação.
            </p>
          </div>

          {/* Card com Badge */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-2)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                Card com Badge
              </h3>
              <span className="badge badge-success">Ativo</span>
            </div>
            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)' }}>
              Card com badge de status no canto superior direito.
            </p>
          </div>

          {/* Card com Ícone */}
          <div className="card">
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-default)',
                backgroundColor: 'var(--color-primary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                  Card com Ícone
                </h3>
                <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)', marginTop: 'var(--spacing-1)' }}>
                  Card com ícone decorativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          BADGES
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          4. Badges
        </h2>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <span className="badge">Padrão</span>
          <span className="badge badge-success">
            <Check size={12} />
            Sucesso
          </span>
          <span className="badge badge-error">
            <X size={12} />
            Erro
          </span>
          <span className="badge badge-warning">
            <AlertCircle size={12} />
            Aviso
          </span>
          <span className="badge badge-info">
            <Info size={12} />
            Informação
          </span>
        </div>
      </section>

      {/* ========================================
          INPUTS E FORMULÁRIOS
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          5. Inputs e Formulários
        </h2>

        <div style={{ maxWidth: '500px' }}>
          {/* Input com Label */}
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <label
              htmlFor="example-input"
              style={{
                display: 'block',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Nome Completo *
            </label>
            <input
              id="example-input"
              type="text"
              className="input"
              placeholder="Digite seu nome completo"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError('');
              }}
            />
          </div>

          {/* Input com Erro */}
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <label
              htmlFor="email-input"
              style={{
                display: 'block',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              E-mail *
            </label>
            <input
              id="email-input"
              type="email"
              className="input"
              placeholder="seuemail@raizeducacao.com.br"
              style={{
                borderColor: 'var(--color-error-500)',
              }}
            />
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-error-500)',
              marginTop: 'var(--spacing-1)',
            }}>
              E-mail inválido. Por favor, verifique.
            </p>
          </div>

          {/* Input com Ícone */}
          <div style={{ marginBottom: 'var(--spacing-4)', position: 'relative' }}>
            <label
              htmlFor="search-input"
              style={{
                display: 'block',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Buscar
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-gray-400)'
                }}
              />
              <input
                id="search-input"
                type="text"
                className="input"
                placeholder="Buscar transações..."
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Textarea */}
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <label
              htmlFor="textarea"
              style={{
                display: 'block',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Observações
            </label>
            <textarea
              id="textarea"
              className="input"
              rows={4}
              placeholder="Digite suas observações aqui..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </section>

      {/* ========================================
          SOMBRAS
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          6. Sombras
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
          <div className="shadow-sm" style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-default)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>shadow-sm</div>
          </div>
          <div className="shadow-md" style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-default)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>shadow-md</div>
          </div>
          <div className="shadow-lg" style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-default)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>shadow-lg</div>
          </div>
          <div className="shadow-primary" style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-default)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>shadow-primary</div>
          </div>
        </div>
      </section>

      {/* ========================================
          ANIMAÇÕES
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          7. Animações
        </h2>

        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <div className="card animate-fadeIn">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Fade In</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>animate-fadeIn</div>
            </div>
          </div>
          <div className="card animate-slideIn">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Slide In</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>animate-slideIn</div>
            </div>
          </div>
          <div className="card">
            <div style={{ textAlign: 'center' }}>
              <div className="animate-pulse" style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-500)',
                margin: '0 auto var(--spacing-2)'
              }} />
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Pulse</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>animate-pulse</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          MODAL (Exemplo)
          ======================================== */}
      <section style={{ marginBottom: 'var(--spacing-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--spacing-4)',
          paddingBottom: 'var(--spacing-2)',
          borderBottom: '2px solid var(--color-gray-200)'
        }}>
          8. Modal
        </h2>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Abrir Modal
        </button>

        {showModal && (
          <>
            <div className="modal-overlay" onClick={() => setShowModal(false)} />
            <div className="modal-container">
              <div style={{ padding: 'var(--spacing-6)' }}>
                <h2 style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-gray-800)',
                  marginBottom: 'var(--spacing-2)'
                }}>
                  Exemplo de Modal
                </h2>
                <p style={{
                  color: 'var(--color-gray-600)',
                  marginBottom: 'var(--spacing-6)'
                }}>
                  Este é um exemplo de modal usando o Design System da Raiz Educação.
                  Clique fora do modal ou no botão "Fechar" para fechá-lo.
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>
                    Fechar
                  </button>
                  <button className="btn-primary" onClick={() => setShowModal(false)}>
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <div style={{
        marginTop: 'var(--spacing-16)',
        padding: 'var(--spacing-6)',
        backgroundColor: 'var(--color-gray-100)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)' }}>
          <strong>Design System da Raiz Educação</strong> • Versão 1.0 • Fevereiro 2026
        </p>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-2)' }}>
          Para mais informações, consulte DESIGN_SYSTEM.md e COMO_USAR_DESIGN_SYSTEM.md
        </p>
      </div>
    </div>
  );
};

export default DesignSystemExample;
