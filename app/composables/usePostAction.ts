import type { DataEvent, DataEventPayload } from '~/composables/useDataBus';

interface FollowUp {
  label: string;
  to: string;
}

interface PostActionOptions {
  toast: {
    title: string;
    description?: string;
  };
  redirect?: string;
  returnToOrigin?: boolean;
  followUp?: FollowUp;
}

export function usePostAction() {
  const route = useRoute();
  const toast = useToast();
  const { emit } = useDataBus();

  function execute(event: DataEvent, payload: DataEventPayload, options: PostActionOptions) {
    // 1. Émettre l'événement bus
    emit(event, payload);

    // 2. Toast de succès avec action optionnelle
    const toastActions = options.followUp
      ? [
          {
            label: options.followUp.label,
            onClick: (_e: MouseEvent) => {
              navigateTo(options.followUp!.to);
            },
          },
        ]
      : [];

    toast.add({
      title: options.toast.title,
      description: options.toast.description,
      color: 'success',
      icon: 'i-lucide-check-circle',
      actions: toastActions,
      duration: toastActions.length > 0 ? 8000 : 4000,
    });

    // 3. Navigation contextuelle
    if (options.returnToOrigin && route.query.from) {
      navigateTo(route.query.from as string);
    } else if (options.redirect) {
      navigateTo(options.redirect);
    }
  }

  return { execute };
}
