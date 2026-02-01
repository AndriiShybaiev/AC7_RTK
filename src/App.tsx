import "./App.css";
import { useState, lazy, Suspense, createContext, useEffect } from "react";


import type { MenuItem, CartItem } from "./entities/entities";
import FoodOrder from "./components/FoodOrder";
import logger from "./services/logging";
import ErrorBoundary from "./components/ErrorBoundary";
import ordersService, { type Order } from "./services/ordersService";

export interface FoodAppContextType {
  orderFood: (food: MenuItem, quantity: number) => void;
}

export const foodAppContext = createContext<FoodAppContextType | null>(null);
// AC 5.1 - Carga Diferida (Lazy) para Foods
const Foods = lazy(() => import("./components/Foods"));

function App() {
  const [isChooseFoodPage, setIsChooseFoodPage] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: 1,
      name: "Hamburguesa de Pollo",
      quantity: 40,
      desc: "Hamburguesa de pollo frito - ... y mayones",
      price: 24,
      image: "cb.jpg",
    },
    {
      id: 2,
      name: "Hamburguesa de Carne",
      quantity: 20,
      desc: "Hamburguesa de carne con queso y tomate",
      price: 30,
      image: "vb.jpg",
    },
    {
      id: 3,
      name: "Helado",
      quantity: 30,
      desc: "Cono de helado",
      price: 28,
      image: "ic.jpg",
    },
    {
      id: 4,
      name: "Patatas fritas",
      quantity: 100,
      desc: "Patatas fritas con salsa verde",
      price: 123,
      image: "chips.jpg",
    },
  ]);

  const [selectedFood, setSelectedFood] = useState<MenuItem | undefined>(undefined);

  // --- carrito ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    logger.debug("Orders: subscribe start");
    setOrdersLoading(true);

    const unsub = ordersService.subscribe(
        (data) => {
          setOrders(data);
          setOrdersLoading(false);
          setOrdersError(null);
        },
        (e) => {
          logger.error(`Orders: subscribe error; ${String(e)}`);
          setOrdersLoading(false);
          setOrdersError(String(e));
        }
    );

    return unsub;
  }, []);


  const orderFood = (food: MenuItem, quantity: number) => {
    logger.info(`Order: start; foodId=${food.id}, qty=${quantity}`);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      logger.warn(`Order: invalid quantity; foodId=${food.id}, qty=${quantity}`);
      return;
    }

    if (quantity > food.quantity) {
      logger.warn(`Order: qty > stock; foodId=${food.id}, qty=${quantity}, stock=${food.quantity}`);
      return; // <-- вот это главное
    }

    // 1) stock
    setMenuItems((prev) =>
        prev.map((item) =>
            item.id === food.id ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item
        )
    );

    // 2) carrito
    setCartItems((prev) => {
      const existing = prev.find((c) => c.id === food.id);
      if (existing) {
        return prev.map((c) => (c.id === food.id ? { ...c, quantity: c.quantity + quantity } : c));
      }
      return [...prev, { id: food.id, name: food.name, price: food.price, quantity }];
    });

    logger.debug(`Order: applied; foodId=${food.id}`);
  };


  const handleReturnToMenu = () => {
    logger.debug("UI: return to menu");
    setSelectedFood(undefined);
  };

  const handleRemoveFromCart = (id: number) => {
    logger.info(`Cart: remove clicked; id=${id}`);
    const removed = cartItems.find((c) => c.id === id);
    if (!removed) {
      logger.warn(`Cart: item not found; id=${id}`);
      return;
    }

    setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + removed.quantity } : item))
    );

    setCartItems(cartItems.filter((c) => c.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);

  return (
      <ErrorBoundary fallback={<div>Algo salió mal!</div>}>
      <foodAppContext.Provider value={{ orderFood }}>
      <div className="App">
        <button
            className="toggleButton"
            onClick={() => {
              logger.info(`UI: toggle page; current=${isChooseFoodPage ? "ORDER" : "STOCK"}`);
              setIsChooseFoodPage(!isChooseFoodPage);
              setSelectedFood(undefined);
            }}
        >
          {isChooseFoodPage ? "Disponibilidad" : "Pedir Comida"}
        </button>

        <h3 className="title">Comida Rapida Online</h3>

        {!isChooseFoodPage && (
            <>
              <h4 className="subTitle">Menús</h4>
              <ul className="ulApp">
                {menuItems.map((item) => (
                    <li key={item.id} className="liApp">
                      <p>{item.name}</p>
                      <p>#{item.quantity}</p>
                    </li>
                ))}
              </ul>
            </>
        )}

        {isChooseFoodPage && (
            <>
              {selectedFood === undefined ? (
                  <Suspense fallback={<div>Cargando detalles ......</div>}>
                    <Foods
                        foodItems={menuItems}
                        onFoodSelected={(food) => {
                          logger.info(`UI: food selected; id=${food.id}, name=${food.name}`);
                          setSelectedFood(food)
                        }} />
                  </Suspense>
              ) : (
                  <FoodOrder
                      food={selectedFood}
                      onReturnToMenu={handleReturnToMenu}
                  />
              )}

              {/* --- carrito UI --- */}
              <div className="cartBox">
                <h4 className="subTitle">Carrito</h4>

                {cartItems.length === 0 ? (
                    <p className="cartEmpty">Carrito vacío</p>
                ) : (
                    <>
                      <ul className="ulCart">
                        {cartItems.map((c) => (
                            <li key={c.id} className="liCart">
                              <span>{c.name} x{c.quantity}   </span>

                              <span>{c.price * c.quantity}$</span>
                              <button onClick={() => handleRemoveFromCart(c.id)}>Quitar</button>
                            </li>
                        ))}
                      </ul>

                      <p className="cartTotal">Total: {cartTotal}$</p>
                    </>
                )}
              </div>
              {/* --- pedidos UI (Firebase) --- */}
              <div className="ordersBox">
                <h4 className="subTitle">Pedidos (Firebase)</h4>

                {ordersLoading && <p>Cargando pedidos...</p>}
                {ordersError && <p>Error cargando pedidos: {ordersError}</p>}

                {!ordersLoading && !ordersError && orders.length === 0 && <p>No hay pedidos.</p>}

                {!ordersLoading && !ordersError && orders.length > 0 && (
                    <ul className="ulOrders">
                      {orders.map((o) => (
                          <li key={o.id} className="liOrders">
                        <span>
                          #{o.id} — {o.status} — {o.total}$
                        </span>

                            <button
                                onClick={() => {
                                  logger.info(`Orders: mark paid; id=${o.id}`);
                                  ordersService.patch(o.id, { status: "PAID" });
                                }}
                            >
                              Marcar pagado
                            </button>

                            <button
                                onClick={() => {
                                  logger.warn(`Orders: delete; id=${o.id}`);
                                  ordersService.deleteById(o.id);
                                }}
                            >
                              Borrar
                            </button>
                          </li>
                      ))}
                    </ul>
                )}
              </div>

            </>
        )}
      </div>
      </foodAppContext.Provider>
      </ErrorBoundary>
  );
}

export default App;