let draggedElement = null;
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

function preventDefault(event) {
    event.preventDefault();
}

function disableScroll() {
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
}

function enableScroll() {
    document.body.removeEventListener('touchmove', preventDefault);
}

function dragStart(event) {
    draggedElement = event.currentTarget;
    draggedElement.style.opacity = "0.4";

    if (isTouchDevice) {
        disableScroll();
    }

    if (!isTouchDevice) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/html", draggedElement.outerHTML);
    }
}

function dragOver(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (!isTouchDevice) {
        event.dataTransfer.dropEffect = "move";
    }
    return false;
}

function drop(event) {
    if (event.stopPropagation) {
        event.stopPropagation();
    }

    if (draggedElement !== event.currentTarget) {
        const parent = draggedElement.parentNode;
        const targetElement = event.currentTarget;

        parent.insertBefore(draggedElement, targetElement);
    }

    draggedElement.style.opacity = "1";
    draggedElement = null;

    updateItemList();

    if (isTouchDevice) {
        enableScroll();
    }
    return false;
}

function dragEnd(event) {
    event.currentTarget.style.opacity = "1";

    if (isTouchDevice) {
        enableScroll();
    }
}

function touchMove(event) {
    const touchLocation = event.targetTouches[0];
    const draggedOverElement = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
    if (draggedOverElement && draggedElement !== draggedOverElement && (draggedOverElement.classList.contains('input-row') || draggedOverElement.classList.contains('recipe-card'))) {
        const parent = draggedElement.parentNode;
        parent.insertBefore(draggedElement, draggedOverElement);
    }
}

function touchEnd(event) {
    draggedElement.style.opacity = "1";
    draggedElement = null;
    enableScroll();
    updateItemList();
}

function reattachDragEvents() {
    const oreIncomeRows = document.querySelectorAll("#oreIncomesContainer .input-row");
    const recipeCards = document.querySelectorAll("#recipesContainer .recipe-card");

    oreIncomeRows.forEach(row => {
        row.addEventListener("dragstart", dragStart);
        row.addEventListener("dragover", dragOver);
        row.addEventListener("drop", drop);
        row.addEventListener("dragend", dragEnd);

        if (isTouchDevice) {
            row.addEventListener("touchstart", dragStart);
            row.addEventListener("touchmove", touchMove);
            row.addEventListener("touchend", touchEnd);
        }
    });

    recipeCards.forEach(card => {
        card.addEventListener("dragstart", dragStart);
        card.addEventListener("dragover", dragOver);
        card.addEventListener("drop", drop);
        card.addEventListener("dragend", dragEnd);

        if (isTouchDevice) {
            card.addEventListener("touchstart", dragStart);
            card.addEventListener("touchmove", touchMove);
            card.addEventListener("touchend", touchEnd);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    reattachDragEvents();
});
