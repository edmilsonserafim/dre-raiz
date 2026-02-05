/**
 * Debounce - Atrasa execução de função até que usuário pare de digitar
 *
 * Útil para: filtros de busca, inputs de texto, validações
 *
 * Fase 5 - Performance & Polish
 */

/**
 * Cria uma função debounced que atrasa a execução até que
 * o usuário pare de chamar por 'delay' ms
 *
 * @param func Função a ser executada
 * @param delay Delay em ms (padrão: 300ms)
 * @returns Função debounced
 *
 * @example
 * const handleSearch = debounce((query: string) => {
 *   console.log('Searching:', query);
 * }, 500);
 *
 * // Usuário digita rápido: "test"
 * handleSearch('t');    // Não executa
 * handleSearch('te');   // Não executa
 * handleSearch('tes');  // Não executa
 * handleSearch('test'); // Executa após 500ms
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    // Limpar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Criar novo timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle - Limita frequência de execução de função
 *
 * Útil para: scroll events, resize events, realtime updates
 *
 * @param func Função a ser executada
 * @param limit Intervalo mínimo entre execuções em ms (padrão: 100ms)
 * @returns Função throttled
 *
 * @example
 * const handleScroll = throttle(() => {
 *   console.log('Scrolled');
 * }, 100);
 *
 * window.addEventListener('scroll', handleScroll);
 * // Executa no máximo a cada 100ms, mesmo que usuário faça scroll contínuo
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
