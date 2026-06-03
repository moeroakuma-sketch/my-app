import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  CartProvider,
  type CartItem,
  useCart,
} from "@/context/cart-context";

const item: Omit<CartItem, "quantity"> = {
  productId: "product-1",
  slug: "sample",
  name: "テスト商品",
  price: 1200,
  imageUrl: "https://picsum.photos/300",
};

function CartHarness() {
  const cart = useCart();

  return (
    <div>
      <div data-testid="count">{cart.itemCount}</div>
      <div data-testid="subtotal">{cart.subtotal}</div>
      <div data-testid="items">{JSON.stringify(cart.items)}</div>
      <button onClick={() => cart.addItem(item)}>add-one</button>
      <button onClick={() => cart.addItem(item, 2)}>add-two</button>
      <button onClick={() => cart.updateQuantity("product-1", 5)}>
        update-five
      </button>
      <button onClick={() => cart.updateQuantity("product-1", 0)}>
        update-zero
      </button>
      <button onClick={() => cart.removeItem("product-1")}>remove</button>
      <button onClick={() => cart.clearCart()}>clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartHarness />
    </CartProvider>,
  );
}

function readItems() {
  return JSON.parse(screen.getByTestId("items").textContent ?? "[]") as CartItem[];
}

describe("cart context", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  test("loads initial items from localStorage", async () => {
    localStorage.setItem(
      "shop-cart",
      JSON.stringify([{ ...item, quantity: 2 }]),
    );

    renderCart();

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("2");
    });
    expect(screen.getByTestId("subtotal").textContent).toBe("2400");
  });

  test("falls back to an empty cart when localStorage JSON is broken", async () => {
    localStorage.setItem("shop-cart", "{broken");

    renderCart();

    await waitFor(() => {
      expect(screen.getByTestId("items").textContent).toBe("[]");
    });
  });

  test("adds new items and increments existing quantities", async () => {
    renderCart();
    await waitFor(() => expect(screen.getByTestId("items").textContent).toBe("[]"));

    fireEvent.click(screen.getByText("add-one"));
    fireEvent.click(screen.getByText("add-two"));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("3");
    });
    expect(readItems()).toEqual([{ ...item, quantity: 3 }]);
  });

  test("updates quantity and removes the item when quantity becomes less than one", async () => {
    renderCart();
    await waitFor(() => expect(screen.getByTestId("items").textContent).toBe("[]"));

    fireEvent.click(screen.getByText("add-one"));
    fireEvent.click(screen.getByText("update-five"));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("5");
    });

    fireEvent.click(screen.getByText("update-zero"));

    await waitFor(() => {
      expect(screen.getByTestId("items").textContent).toBe("[]");
    });
  });

  test("removes and clears items", async () => {
    renderCart();
    await waitFor(() => expect(screen.getByTestId("items").textContent).toBe("[]"));

    fireEvent.click(screen.getByText("add-one"));
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("1"));

    fireEvent.click(screen.getByText("remove"));
    await waitFor(() => expect(screen.getByTestId("items").textContent).toBe("[]"));

    fireEvent.click(screen.getByText("add-two"));
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("2"));

    fireEvent.click(screen.getByText("clear"));
    await waitFor(() => expect(screen.getByTestId("items").textContent).toBe("[]"));
  });
});
