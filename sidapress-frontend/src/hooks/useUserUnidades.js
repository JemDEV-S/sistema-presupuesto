import { useCallback, useMemo } from 'react';
import useAuthStore, {
  selectIsGlobalAccess,
  selectAllowedUnidades,
  selectDefaultUnidadCodigo,
} from '../store/authStore';

export const useUserUnidades = () => {
  const isGlobalAccess = useAuthStore(selectIsGlobalAccess);
  const allowedUnidades = useAuthStore(selectAllowedUnidades);
  const defaultCodigo = useAuthStore(selectDefaultUnidadCodigo);

  // Derivar códigos con useMemo para mantener referencia estable
  const allowedCodigos = useMemo(() => {
    if (allowedUnidades === null) return null;
    return allowedUnidades.map((u) => u.codigo);
  }, [allowedUnidades]);

  const isUnidadAllowed = useCallback(
    (codigo) => {
      if (isGlobalAccess) return true;
      return allowedCodigos?.includes(codigo) || false;
    },
    [isGlobalAccess, allowedCodigos]
  );

  const filterUnidadOptions = useCallback(
    (options) => {
      if (isGlobalAccess) return options;
      return options.filter((opt) => isUnidadAllowed(opt.value));
    },
    [isGlobalAccess, isUnidadAllowed]
  );

  return {
    isGlobalAccess,
    allowedUnidades,
    allowedCodigos,
    defaultCodigo,
    isUnidadAllowed,
    filterUnidadOptions,
  };
};
