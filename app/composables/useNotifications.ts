export function useNotifications() {
  const toast = useToast();

  function success(title: string, description?: string) {
    toast.add({ title, description, color: 'success', icon: 'i-lucide-check-circle' });
  }

  function error(title: string, description?: string) {
    toast.add({ title, description, color: 'error', icon: 'i-lucide-alert-circle' });
  }

  function warning(title: string, description?: string) {
    toast.add({ title, description, color: 'warning', icon: 'i-lucide-alert-triangle' });
  }

  function info(title: string, description?: string) {
    toast.add({ title, description, color: 'info', icon: 'i-lucide-info' });
  }

  return { success, error, warning, info };
}
