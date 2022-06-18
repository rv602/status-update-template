var tour_popper;
function showPopper(popperNodeOptions, targetNode) {
    let title = popperNodeOptions.title;
    let body = popperNodeOptions.body;
    let popperClass = popperNodeOptions.class || '';
    let dismissBtn = popperNodeOptions.dismissBtn || {};
    let nextBtn = popperNodeOptions.nextBtn || {};
    let popperNode = document.createElement('DIV'); // Create a <div> node
    popperNode.classList.add('popperNode', 'hidden');
    if (popperClass) {
        popperNode.classList.add(popperClass);
    }
    popperNode.innerHTML = `
        <div class='popperHeader'>${title}</div>
        <div class='popperBody'>${body}</div>
        <div class='popperFooter'><span class='gmail-like-btn dismissBtn ${dismissBtn.class || 'hidden'}'>${
        dismissBtn.text
    }</span><span class='gmail-like-btn nextBtn ${nextBtn.class || 'hidden'}'>${nextBtn.text}</span></div>
        `;

    let dismissBtnRef = popperNode.querySelector('.dismissBtn');
    let nextBtnRef = popperNode.querySelector('.nextBtn');
    if (typeof dismissBtn.fn === 'function') {
        dismissBtnRef && dismissBtnRef.addEventListener('click', dismissBtn.fn);
    } else {
        dismissBtnRef && dismissBtnRef.addEventListener('click', closePopper);
    }
    if (typeof nextBtn.fn === 'function') {
        nextBtnRef && nextBtnRef.addEventListener('click', nextBtn.fn);
    } else {
        nextBtnRef && nextBtnRef.addEventListener('click', closePopper);
    }
    targetNode.parentNode.insertBefore(popperNode, targetNode);
    popperNode.classList.remove('hidden');
    tour_popper = new Popper(targetNode, popperNode, {
        placement: 'left-start',
        modifiers: {
            offset: {
                enabled: true,
                offset: '0,5'
            }
        }
    });
}

function closePopper() {
    tour_popper.popper.parentNode.removeChild(tour_popper.popper);
    tour_popper.destroy();
}
