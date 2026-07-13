// Infinite Proxy Mock for authClient to replace better-auth across the codebase

const mockUser = {
  id: "cmri3jxi700041mmgjct8xyss",
  name: "Nazmul Admin",
  email: "nazmulhas36@gmail.com",
  role: "Admin",
  department: "Engineering",
  designation: "CTO"
};

const createDummyHook = () => {
  return {
    useSession: () => ({ data: { user: mockUser }, isLoading: false, error: null })
  };
};

const proxyHandler: ProxyHandler<any> = {
  get: function(target: any, prop: string | symbol): any {
    if (typeof prop === 'string') {
      if (prop === 'useSession') {
        return createDummyHook().useSession;
      }
      if (prop === 'signIn' || prop === 'signOut' || prop === 'signUp') {
        return new Proxy(() => Promise.resolve({ data: null, error: null }), proxyHandler);
      }
    }
    
    // Fallback infinite proxy
    return new Proxy(() => Promise.resolve({ data: null, error: null }), proxyHandler);
  }
};

export const authClient = new Proxy({}, proxyHandler);
