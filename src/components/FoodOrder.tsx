import {useState, type MouseEventHandler, type ChangeEvent, useContext} from "react";
import type {CartItem, MenuItem} from "../entities/entities";
import {foodAppContext} from "../App.tsx";
import logger from "../services/logging";
import orderService from "../services/ordersService";

interface FoodOrderProps {
    food: MenuItem;
    onReturnToMenu: MouseEventHandler<HTMLButtonElement> | undefined;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function FoodOrder(props: FoodOrderProps) {
    const quantityContext = useContext(foodAppContext);
    if (!quantityContext) throw new Error("No se ha encontrado el contexto de pedidos");

    const [quantity, setQuantity] = useState(1);
    const [totalAmount, setTotalAmount] = useState(props.food.price);
    const [isOrdered, setIsOrdered] = useState(false);
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
        const q = Number(e.target.value);
        const safeQ = Number.isFinite(q) && q > 0 ? q : 1;
        logger.debug(`FoodOrder: quantity changed; raw=${e.target.value}, safe=${safeQ}`);
        setQuantity(safeQ);
        setTotalAmount(props.food.price * safeQ);
    };

    const handleSendOrder = async () => {
        logger.info(`FoodOrder: send order clicked; foodId=${props.food.id}, qty=${quantity}`);
        setSaveState("saving");
        setSaveError(null);
        try{
            quantityContext?.orderFood(props.food, quantity);

            const item: CartItem = {
                id: props.food.id,
                name: props.food.name,
                price: props.food.price,
                quantity,
            };

            const orderId = await orderService.create({ items: [item] });
            logger.info(`Order: saved to Firebase; id=${orderId}`);

            setIsOrdered(true);
            setSaveState("saved");
        } catch (e) {
            logger.error(`Order: save failed; ${String(e)}`);
            setIsOrdered(false);
            setSaveState("error");
            setSaveError(String(e));
        }

    };

    return (
        <div className="foodOrder">
            <h4>Pedido</h4>
            <p>{props.food.name}</p>

            {!isOrdered ? (
                <>
                    <label>
                        Cantidad:
                        <input type="number" min={1} value={quantity} onChange={handleQuantityChange} />
                    </label>

                    <p>Precio: {totalAmount}$</p>

                    <button onClick={handleSendOrder} disabled={saveState === "saving"}>
                        {saveState === "saving" ? "Guardando..." : "Enviar pedido"}</button>

                    {saveState === "saving" && <p>Guardando pedido en Firebase...</p>}
                    {saveState === "saved" && <p>Pedido guardado.</p>}
                    {saveState === "error" && <p>Error guardando pedido: {saveError}</p>}

                    <button onClick={props.onReturnToMenu}>Volver al menú</button>
                </>
            ) : (
                <>
                    <p>Pedido confirmado.</p>
                    <button onClick={props.onReturnToMenu}>Volver al menú</button>
                </>
            )}
        </div>
    );
}

export default FoodOrder;
