const defaultConfig = {
	button: {
		close: {
			classes: "kStepper-btn kStepper-close",
			hidden: false,
			text: `
				<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
				<svg width="16px" height="16px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect width="48" height="48" fill="white" fill-opacity="0.01"/>
					<path d="M14 14L34 34" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M14 34L34 14" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			`,
		},
		next: {
			classes: "kStepper-btn kStepper-next",
			hidden: false,
			text: "Next",
		},
		previous: {
			classes: "kStepper-btn kStepper-previous",
			hidden: false,
			text: "Previous",
		},
	},
	style: {
		backdrop: {
			backgroundColor: "rgba(0, 0, 0, .75)",
		},
		hint: {
			backgroundColor: "rgba(50, 200, 25, 0.5)",
			boxShadow: {
				r: 0,
				g: 255,
				b: 0,
			},
		},
		infoBox: {
			backgroundColor: "hsla(0, 0%, 92%, 1)",
			boxShadow: "0 6px 10px rgba(0, 0, 0, .12), 0 3px 6px rgba(0, 0, 0, .24)",
		},
		tooltip: {
			backgroundColor: "hsla(0, 0%, 92%, 1)",
			boxShadow: "0 6px 10px rgba(0, 0, 0, .12), 0 3px 6px rgba(0, 0, 0, .24)",
		},
	},
};

export default class kStepper {
	constructor(config = defaultConfig) {
		this.config = config;

		this.hints = undefined;
		this.hintNodes = [];
		this.steps = undefined;
		this.currentStep = undefined;
		this.currentStepIndex = 0;

		this.kStepListener = undefined;
		this.kHintListener = undefined;
		this.kWindowResizeListener = undefined;
	}

	addHints(hintsArray) {
		this.hints = hintsArray;
	}

	extractHintsFromHtml() {
		this.hints = [];
		const allHintNodes = document.querySelectorAll(`[data-kHint]`);

		allHintNodes.forEach(node => {
			const element = node.getAttribute("data-kHint");
			const title = node.getAttribute("data-kHint-title");
			const description = node.getAttribute("data-kHint-description");
			node.id = element;

			const hint = {
				element: `#${element}`,
				title: title,
				description: description,
			};
			this.hints.push(hint);
		});
	}

	showHints() {
		if (!this.hints) {
			this.extractHintsFromHtml();
		}

		this.hints.map(hint => {
			const el = document.querySelector(hint.element);
			const offsetTop = this.getTotalOffset(el);
			const offsetLeft = el.offsetLeft;

			const newHint = document.createElement("div");
			newHint.classList = "kHint";
			newHint.style.top = `${offsetTop}px`;
			newHint.style.left = `${offsetLeft}px`;
			newHint.setAttribute("data-id", hint.element);

			document.body.append(newHint);
			this.hintNodes.push(newHint);
		});

		if (!this.kHintListener) this.hintsListener();
		if (!this.kWindowResizeListener) this.resizeListener();
	}

	renderTooltip(id, hintElement, title, description) {
		const newTooltip = document.createElement("div");
		newTooltip.classList = "kStepper-infobox";
		newTooltip.innerHTML = `
			<div class="kStepper-infobox-header">
				<button id="kHintClose" data-id="${id}" class="kStepper-btn kStepper-close">
					${this.config.button.close.text}
				</button>
				<div class="kStepper-infobox-title">
					<h3>${title}</h3>
				</div>
			</div>
			<div class="kStepper-infobox-body">
				<p>${description}</p>
			</div>
			<div class="kStepper-infobox-footer">
				<button id="kHintClose" data-id="${id}" class="kStepper-btn kStepper-done">
					Close
				</button>
			</div>
		`;

		hintElement.append(newTooltip);
	}

	addSteps(stepsArray) {
		this.steps = stepsArray;
	}

	extractStepsFromHtml() {
		this.steps = [];
		const allStepNodes = document.querySelectorAll(`[data-kStep]`);

		console.log(allStepNodes);

		allStepNodes.forEach(node => {
			const element = node.getAttribute("data-kStep");
			const title = node.getAttribute("data-kStep-title");
			const description = node.getAttribute("data-kStep-description");
			node.id = element;

			const step = {
				element: `#${element}`,
				title: title,
				description: description,
			};
			this.steps.push(step);
		});
	}

	startWalkthrough() {
		if (!this.steps) {
			this.extractStepsFromHtml();
		}

		const bottomElement = document.createElement("div");
		bottomElement.className = "kStepper-page-bottom-reference";
		document.body.append(bottomElement);
		const documentHeight = bottomElement.offsetTop;

		const kStepperElement = document.createElement("div");
		kStepperElement.classList = "kStepper";
		kStepperElement.style.height = `${documentHeight}px`;
		kStepperElement.innerHTML = `
			<div class="kStepper-top">
			</div>
			<div class="kStepper-middle">
				<div class="kStepper-middle-first">
				</div>
				<div class="kStepper-focus">
				</div>
				<div class="kStepper-middle-last">
				</div>
			</div>
			<div class="kStepper-bottom">
			</div>
		`;

		document.body.append(kStepperElement);

		this.renderNextStep();
		if (!this.kStepListener) this.stepsListener();
		if (!this.kWindowResizeListener) this.resizeListener();
	}

	renderNextStep() {
		this.currentStep = this.steps[this.currentStepIndex];
		this.renderOutline(this.currentStep.element);
		this.renderInfobox(this.currentStep.title, this.currentStep.description);
	}

	renderOutline(stepElement) {
		const el = document.querySelector(stepElement);
		const offset = this.getTotalOffset(el);

		let elTranslateX = 0;
		let elTranslateY = 0;

		const elStyle = window.getComputedStyle(el);
		const elMatrix = elStyle.transform;
		if (elMatrix !== "none") {
			const elMatrixValues = elMatrix.slice(7, -1).split(',');
			const elTranslate = elMatrixValues.slice(-2);
			elTranslateX = Number(elTranslate[0]);
			elTranslateY = Number(elTranslate[1]);
		}

		const elWidth = el.clientWidth + 12;
		const elHeight = el.clientHeight + 12;
		const elTop = offset - 6;
		const elLeft = el.offsetLeft - 6;

		const kStepperTop = document.querySelector(".kStepper-top");
		if (elMatrix) {
			kStepperTop.style.height = `${elTop + elTranslateY}px`;
		} else {
			kStepperTop.style.height = `${elTop}px`;
		}

		const kStepperMiddle = document.querySelector(".kStepper-middle");
		kStepperMiddle.style.height = `${elHeight}px`;

		const kStepperMiddleFirst = document.querySelector(".kStepper-middle-first");
		if (elMatrix) {
			kStepperMiddleFirst.style.width = `${elLeft + elTranslateX}px`;
		} else {
			kStepperMiddleFirst.style.width = `${elLeft}px`;
		}

		const kStepperFocus = document.querySelector(".kStepper-focus");
		kStepperFocus.style.height = `${elHeight}px`;
		kStepperFocus.style.width = `${elWidth}px`;

		el.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
			inline: 'center',
		});
	}

	renderInfobox(title, description) {
		const oldInfoBox = document.querySelector(".kStepper-infobox");
		if (oldInfoBox) {
			oldInfoBox.remove();
		}

		const infoBox = document.createElement("div");
		infoBox.classList = "kStepper-infobox";
		infoBox.innerHTML = `
			<div class="kStepper-infobox-header">
				<button id="kStepClose" class="kStepper-btn kStepper-close">
					${this.config.button.close.text}
				</button>
				<div class="kStepper-infobox-title">
					<h3>${title}</h3>
				</div>
			</div>
			<div class="kStepper-infobox-body">
				<p>${description}</p>
			</div>
			<div class="kStepper-infobox-footer">
				<button id="${this.currentStepIndex + 1 >= this.steps.length ? "kStepperComplete" : "kStepperNext"}" class="kStepper-btn kStepper-next">
					${this.currentStepIndex + 1 >= this.steps.length ? "Done" : "Next"}
				</button>
				<button id="kStepperPrevious" class="${this.currentStepIndex <= 0 ? "hidden" : ""} kStepper-btn kStepper-previous">
					Previous
				</button>
			</div>
		`;

		const kStepperFocus = document.querySelector(".kStepper-focus");
		kStepperFocus.append(infoBox);
	}

	getTotalOffset(element) {
		let totalOffset = 0;
		let currentElement = element;
		const allElements = [];

		let done = false;

		while (!done) {
			if (currentElement.offsetTop === 0) {
				done = true;
			} else {
				totalOffset += currentElement.offsetTop;
				allElements.push(currentElement);
				currentElement = currentElement.offsetParent;
			}
		}

		return totalOffset;
	}

	stepsListener() {
		this.kStepListener = document.addEventListener("click", e => {
			if (e.target.id === "kStepperPrevious") {
				this.currentStepIndex--;
				this.renderNextStep();
			}

			if (e.target.id === "kStepperNext") {
				this.currentStepIndex++;
				this.renderNextStep();
			}

			if (e.target.id === "kStepperComplete" || e.target.id === "kStepClose") {
				const kStepper = document.querySelector(".kStepper");
				const bottomElement = document.querySelector(".kStepper-page-bottom-reference");
				kStepper.remove();
				bottomElement.remove();
				removeEventListener("click", this.kStepListener);
				this.steps = [];
			}
		});
	}

	hintsListener() {
		this.kHintListener = document.addEventListener("click", e => {
			if (e.target.className === "kHint") {
				const hintElement = e.target;
				hintElement.style.pointerEvents = "none";
				const id = e.target.getAttribute("data-id");
				const selectedHint = this.hints.find(hint => hint.element === id);

				this.renderTooltip(id, hintElement, selectedHint.title, selectedHint.description);
			}

			if (e.target.id === "kHintClose") {
				const id = e.target.getAttribute("data-id");
				const elements = document.querySelectorAll(`[data-id="${id}"]`);

				elements.forEach(element => {
					if (element.className === "kHint") {
						element.remove();
					}
				});

				const selectedHint = this.hints.find(hint => hint.element === id);
				const hintIndex = this.hints.indexOf(selectedHint);
				if (hintIndex !== -1) {
					this.hints.splice(hintIndex, 1);
				}

				const selectedHintNode = this.hintNodes.find(hint => {
					const dataId = hint.getAttribute("data-id");
					if (dataId === id) return hint;
				});
				const hintNodeIndex = this.hintNodes.indexOf(selectedHintNode);
				if (hintNodeIndex !== -1) {
					this.hintNodes.splice(hintNodeIndex, 1);
				}

				if (this.hints.length <= 0) {
					removeEventListener("click", this.kHintListener);
				}
			}
		});
	}

	resizeListener() {
		let resizeTimer;

		this.kWindowResizeListener = window.addEventListener("resize", e => {
			if (this.steps.length <= 0 && this.hints.length <= 0) {
				removeEventListener("resize", this.kWindowResizeListener);
			}

			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				if (this.steps.length > 0) this.renderNextStep();

				if (this.hintNodes.length > 0) {
					this.hintNodes.forEach(node => {
						const id = node.getAttribute("data-id");
						const hint = this.hints.find(hint => hint.element === id);
						const el = document.querySelector(hint.element);
						const offsetTop = this.getTotalOffset(el);
						const offsetLeft = el.offsetLeft;

						node.style.top = `${offsetTop}px`;
						node.style.left = `${offsetLeft}px`;
					});
				}
			}, 500);
		});
	}
}
