import React from 'react';

const reactRouterDom = {
  Link: ({ children, to, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/'
  }),
  useParams: () => ({}),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>
};

module.exports = reactRouterDom;
