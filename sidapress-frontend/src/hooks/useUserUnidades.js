import { useCallback } from 'react';
import useAuthStore, {
  selectIsGlobalAccess,
  selectAllowedUnidades,
  selectAllowedUnidadCodigos,
  selectDefaultUnidadCodigo,
} from '../store/authStore';

export const useUserUnidades = () => {
  const isGlobalAccess = useAuthStore(selectIsGlobalAccess);
  const allowedUnidades = useAuthStore(selectAllowedUnidades);
  const allowedCodigos = useAuthStore(selectAllowedUnidadCodigos);
  const defaultCodigo = useAuthStore(selectDefaultUnidadCodigo);

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
