// properties
let toastErrorBootstrap = null
let Scrollbar = window.Scrollbar;
let startScreen = true

// define toast error
const toastError = document.getElementById('toastError')

// check if element is valid
if (toastError) {
	// init component
  toastErrorBootstrap = bootstrap.Toast.getOrCreateInstance(toastError)
}

// define targets
let targets = 'div#raffleBox .ballot-card-paper'
// define monitor to follow y axis spacings
let holder = {}

// initialize
let init = function (){
	// define holder
	holder = {
		yAxisMonitor: 0,
		yAxisSpacing: 0,
		pointsMap: new Map(),
		shuffledIndices: [],
		blinkTimes: 0,
		blinkSlowly: 1000,
		blinkFast: 0,
		delaySlowly: anime.stagger(100),
		delayFast: 0,
		spacingX: 0,
		spacingY: 0,
		paperWidthHeight: 0,
		distanceBetweenCards: 0,
		revealedStatus: false
	}
	// change screen status
	startScreen = false
	// change text of papers
	raffleBox.classList.remove('all-white-text')
}

// animation to reveal paper content
let revealPaperContent = function(e) {
	// element
	let element = e.target.classList.contains('ballot-card-paper') 
		? e.target : e.target.closest('.ballot-card-paper')

	// check if element has been revealed
	if(!element.classList.contains('revealed')) {
		// change revealed status
		holder.revealedStatus = true

		// animation
		let openPaper = anime({
			targets: element,
			rotateY: {
				value: 0, duration: 500
			},
			scale: [
				{ value: 1.3, duration: 200 },
				{ value: 1, duration: 100 }
			],
			easing: 'easeInOutSine',
			duration: 200,
			autoplay: false,
			update: function(anim) {},
			complete: function(anim) {
				element.classList.add('revealed')
			}
		})

		openPaper.play()
	}
}

// blink animation function wrapper
let blink = function(){
	// shuffle
	shuffleFisherYates()
	// animation to shuffle papers fast
	let fastShuffle = anime({
		targets,
		translateX: function(el, i) {
			// get key
			let misplacedKey = holder.shuffledIndices[i]
			// get data by misplaced key
			let data = holder.pointsMap.get(misplacedKey)

			return data.x
		},
		translateY: function(el, i) {
			// get key
			let misplacedKey = holder.shuffledIndices[i]
			// get data by misplaced key
			let data = holder.pointsMap.get(misplacedKey)

			return data.y
		},
		rotate: {
			value: 360, duration: 500, delay: anime.stagger(10)
		},
		rotateY: {
			value: 180, duration: 500, delay: anime.stagger(20)
		},
		duration: holder.blinkFast,
		delay: holder.delayFast,
		autoplay: false,
		complete: function(anim) {
			// check no of times blinked
			if (holder.blinkTimes < 1) {
				// change duration and delay
				holder.blinkFast = holder.blinkSlowly
				holder.delayFast = holder.delaySlowly

				// re-play
				blink()
			} else if (holder.blinkTimes == 1 && !startScreen) {
				// change text of papers
				raffleBox.classList.add('all-white-text')
				// attach scrollbar
				Scrollbar.init(document.querySelector('#raffleBox'), {
					thumbMinSize: 5,
					alwaysShowTracks: false
				})
				// show bottom pane 
				raffleBottomPane.style.setProperty('display', 'flex', 'important')
			}

			// increase
			holder.blinkTimes++
		}
	})

	fastShuffle.play()
}

// stack animation function wrapper
let stackUpPapers = function() {
	// main animation to stack values
	let stackAnimation = anime({
		targets,
		translateX: function(el, i) {
			// get x point for element
			let xPoint = ((i < 1) || (i % 2) < 1) ? holder.distanceBetweenCards : holder.spacingX

			// set x point
			holder.pointsMap.set(el.getAttribute('data-i'), {
				x: xPoint,
				y: 0
			})
			
			return xPoint
		},
		translateY: function(el, i) {
			// check if y point is exhausted by a pair already and reset
			if (holder.yAxisMonitor == 2) {
				// reset monitor
				holder.yAxisMonitor = 0
				// set addtional point
				holder.yAxisSpacing += (holder.spacingY - holder.distanceBetweenCards)
			}
			// increase axis monitor
			holder.yAxisMonitor++

			// get data
			let data = holder.pointsMap.get(el.getAttribute('data-i'))

			// set y point
			holder.pointsMap.set(el.getAttribute('data-i'), { ...data, y: holder.yAxisSpacing })

			return holder.yAxisSpacing
		},
		duration: 1000,
		delay: anime.stagger(90),
		easing: 'easeInOutSine',
		autoplay: false,
		complete: function(anim) {
			// play the fast shuffle animation
			blink()
		}
	})

	stackAnimation.play()
}

// generate raffle
const generateRaffle = () => {
	// initialize
	init()

	// get number of players
	let players = noOfPlayers.value

	// check if value is valid
	if (isNaN(players) || players < 3) {
		// conflict
		showError('Please provide a valid number!')
		return
	}

	// hide
	toggleModal('hide')

	// define variables
	let paper = null,
			wrapper = null,
			front = null,
			back = null,
			label = 0,
			step = 1

	// pass on inner content
	if (!raffleBoxShadow.childNodes.length)
		raffleBoxShadow.innerHTML = raffleBox.innerHTML

	// check if scrollbar is present for element
	if (Scrollbar.has(document.querySelector('#raffleBox'))) {
		// destroy scrollbar
		Scrollbar.destroy(document.querySelector('#raffleBox'))
		// hide bottom pane
		raffleBottomPane.style.setProperty('display', 'none', 'important')
	}

	// hide container
	raffleBox.innerHTML = ''

	// show top pane
	raffleTopPane.style.setProperty('display', 'flex', 'important')

	// get box size
	let raffleBoxProperties = {
		width: raffleBox.clientWidth,
		children: Math.ceil(players / 2)
	}

	// get width for paper
	holder.paperWidthHeight = (raffleBoxProperties.width / 2) - 50
	// get distance between cards 
	holder.distanceBetweenCards = ((raffleBoxProperties.width - (holder.paperWidthHeight * 2)) / 3) - 10
	
	// get spacing
	let spacing = holder.paperWidthHeight + (holder.distanceBetweenCards * 2) + 10
	
	// get x & y axis spacings
	holder.spacingX = spacing
	holder.spacingY = spacing
	holder.yAxisSpacing = holder.distanceBetweenCards

	// paddings
	let paddings = {
		top: (raffleTopPane.clientHeight - holder.distanceBetweenCards),
		bottom: ((holder.distanceBetweenCards + 10) + raffleTopPane.clientHeight),
	}

	// adjust padding bottom property
	raffleBox.style.paddingBottom = paddings.bottom + 'px'
	raffleBox.style.paddingTop = paddings.top + 'px'

	// compute height of box
	raffleBoxProperties['height'] = (holder.paperWidthHeight * raffleBoxProperties.children) + paddings.bottom + paddings.top

	// check if computed height is more than window
	if ((raffleBoxProperties.height + 40) > document.documentElement.clientHeight) {
		// adjust height of box
		raffleBox.style.height = '90vh'
	} else raffleBox.style.minHeight = raffleBoxProperties.height + 'px'

	// loop
	for (let i = 1; i <= players; i++) {
		// create element
		paper = document.createElement('div')
		wrapper = document.createElement('div')
		front = document.createElement('div')
		back = document.createElement('div')

		// adjust label
		label = (i <= 2) ? 1 : ((i % 2) != 0 ? ((i < players) ? (i - step++) : 'X') : (i / 2)) 
		
		// add text
		front.innerText = label

		// adjust paper properties
		paper.style.maxWidth = holder.paperWidthHeight + 'px'
		paper.style.maxHeight = holder.paperWidthHeight + 'px'
		
		// add a unique id
		paper.setAttribute('data-i', i.toString())
		
		// add class to element
		paper.classList.add('ballot-card-paper')
		wrapper.classList.add('ballot-card-paper-wrapper')
		front.classList.add('ballot-card-paper-front')
		back.classList.add('ballot-card-paper-back')

		// add elements to wrapper
		wrapper.appendChild(back)
		wrapper.appendChild(front)
		
		// add children elements
		paper.appendChild(wrapper)
		// add event listener
		paper.addEventListener('click', revealPaperContent)
		// add paper to container
		raffleBox.appendChild(paper)
	}

	// stack up cards
	stackUpPapers()
}

// toggle modal
const toggleModal = (mode = 'show') => {
	// reset input
	noOfPlayers.value = ''
	// show modal
	$('#modal-no-players').modal(mode)
}

// reset view
const resetView = (showResizeInfo = false) => {
	// check shadow contains content
	if (raffleBoxShadow.childNodes.length) {
		// check if to show resize
		if (showResizeInfo) {
			// remove error class
			toastError.classList.remove('text-bg-danger')
			// add info class
			toastError.classList.add('text-bg-info')
			// show error info
			showError(`A change in your device's view has been detected! Please start again.<br><br>NOTE* In future updates, this would not pose any problems.`, false)
		}

		// hide panes
		raffleTopPane.style.setProperty('display', 'none', 'important')
		raffleBottomPane.style.setProperty('display', 'none', 'important')

		// pass back content
		raffleBox.innerHTML = raffleBoxShadow.innerHTML
		// reset shadow
		raffleBoxShadow.innerHTML = ''
		// remove inline styling
		raffleBox.removeAttribute('style')

		// change status
		startScreen = true
	}
}

// attempt reshuffle
const attemptReshuffle = () => {
	// check if element has been revealed
	if (!holder.revealedStatus) {
		// re-play
		blink()
	} else {
		// show error
		showError('Cannot reshuffle because a card has already been revealed!')
	}
}

// shuffle the keys of the map
let shuffle = () => holder.shuffledIndices = Array.from(holder.pointsMap.keys()).sort(() => Math.random() - 0.5)

// shuffle using the fisher-yates algorithm
let shuffleFisherYates = () => {
	// get array
	let array = Array.from(holder.pointsMap.keys())
	// loop through
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  // pass array
  holder.shuffledIndices = array
}

// display error alert
const showError = (message = '', error = true) => {
	// check if error class is absent
	if (error && !toastError.classList.contains('text-bg-danger')) {
		// remove info class
		toastError.classList.remove('text-bg-info')
		// add error class
		toastError.classList.add('text-bg-danger')
	}

	// conflict
	toastErrorMessage.innerHTML = message || 'An error occurred!'
	// show error
	toastErrorBootstrap.show()
	return
}

// window on resize
window.onresize = () => {
	// reset view
	resetView(true)
}