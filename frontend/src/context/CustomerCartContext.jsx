import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CustomerCartContext = createContext(null);
const CART_STORAGE_KEY = "customerPortalCart";

function loadCartFromSession() {
  try {
    const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
}

export function CustomerCartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCartFromSession);

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product) {
    setCartItems((previousItems) => {
      const existingItem = previousItems.find((item) => item.id === product.id);

      if (existingItem) {
        return previousItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  Number(item.quantity) + 1,
                  Number(product.stock_quantity || 1)
                ),
              }
            : item
        );
      }

      return [
        ...previousItems,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price || 0),
          stock_quantity: Number(product.stock_quantity || 0),
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    const nextQuantity = Number(quantity);

    setCartItems((previousItems) =>
      previousItems
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.max(
              1,
              Math.min(nextQuantity, Number(item.stock_quantity || 1))
            ),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCartItems((previousItems) =>
      previousItems.filter((item) => item.id !== productId)
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }, [cartItems]);

  return (
    <CustomerCartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CustomerCartContext.Provider>
  );
}

export function useCustomerCart() {
  const context = useContext(CustomerCartContext);

  if (!context) {
    throw new Error("useCustomerCart must be used inside CustomerCartProvider");
  }

  return context;
}