"use client";

import { useRef, useState } from "react";
import type { GeneratedPlate } from "@/lib/calculations/plateComposer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SWIPE_THRESHOLD = 100;

export function SwipeCard({
  plate,
  onAccept,
  onReject,
}: {
  plate: GeneratedPlate;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }

  function handlePointerUp() {
    if (dragX > SWIPE_THRESHOLD) {
      onAccept();
    } else if (dragX < -SWIPE_THRESHOLD) {
      onReject();
    }
    setDragging(false);
    setDragX(0);
  }

  const rotation = dragX / 20;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        className="w-full max-w-sm touch-none select-none"
      >
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-chocolate">{plate.name}</h3>
            <span className="text-xs capitalize text-cafe">{plate.cookingMethod}</span>
          </div>
          <ul className="flex flex-col gap-1 text-sm text-cafe">
            {plate.ingredients.map((ing, i) => (
              <li key={`${ing.food.id}-${i}`}>
                • {ing.food.name} ({ing.quantity}×)
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-salvia/40 pt-2 text-sm text-chocolate">
            <span>{Math.round(plate.totalCalories)} cal</span>
            <span>{plate.totalNetCarbsG.toFixed(1)}g net carbs</span>
          </div>
        </Card>
      </div>
      <div className="flex gap-4">
        <Button variant="danger" onClick={onReject}>
          ✕ Skip
        </Button>
        <Button onClick={onAccept}>♥ Accept</Button>
      </div>
    </div>
  );
}
