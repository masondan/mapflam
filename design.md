## Design and UX guide

Study the visuals in info folder. Follow the designs at each stage of the user journey and, if applicable, raise any comments or suggestions to improve the UX and UI before coding.

Main font: Inter, Inter Bold
Palette:
Primary text colour for labels, buttons etc: #777777
Darker colour for highlight text: #333333
Lighter colour for placeholder text: #999999
Background grey for panels: #efefef
App brand colour: #5422b0
App brand highlight colour: #f0e6f7

Cards: All cards have a default #777777 border

Colour picker defaults:
#5422b0
#02441F
#004269
#AB0000
#000000
#FFFFFF


## App launch

- The app should be ready to add to the home screen of iOS and Android devices. A maskable icon is provided. When launched on Android, the intermediate native splash screen (visible for only an instant as the app loads) should be solid app brand colour #5422b0 with the maskable app logo displayed in the centre of the screen
- Note: When deployed, the home view the user sees after launching the app will carry the URL (probably) mapflam.pages.dev (NOT mapflam.pages.dev/home)
- Note: No sign in or registration is required for the app.
- Note: The app is mobile-first but will also be used on desktop browsers., In desktop browsers the app should be constrained to 480px to maintain mobile experience, with a subtle shadow to the left and right of the viewport to distinguish the app from a white browser page background.

Icons:
logo-mapflam-maskable.png (maskable icon)

## SEO, sharing, favicon

- A manifest file should be prepared to allow for sharing on social media, WA and elsewhere with logo and app description. A general purpose icon is provided.
	- App title: MapFlam
	- Description: A mobile-first tool for creating simple, stylish maps

Icons:
logo-mapflam-purple-gen.png (general purpose 512x512 logo)
logo-mapflam-favicon.png (favicon icon)


## App initial view

- This is the home screen and first view when the user opens the app.
- The app has a white background
- The MapFlam logo sits top centre of the page, with a fine #777777 underscore. The header scrolls with the page
- Under the header, aligned left, are two tab headers: Create and Saved. The active tab is brand purple with a purple underscore
- Under the tabs is a row with Basemap dropdown and selectors for 9:16, 1:1, and 16:9 ratios. Text based buttons, #777777 by default, with reverse white text on #777777 background for active.
- The default map (centred, if possible, on users current location) is displayed in the selected ratio. The map can be dragged with one finger and zoomed in or out with two fingers.
- Beneath the map is the centered ‘add new pin’ button
- Beneath the add new pin button is the Inset Map toggle (you create a standard, smooth toggle that is #777777 by default with brand purple highlight when active
- Beneath the Inset Map toggle are two buttons: Download and New Map. Both are greyed out #999999 until a pin is inserted into the map. At that point, the buttons become active (#777777)

Icons:
logotype-mapflam-purple-trs
icon-newpin.svg

Visuals:
view1


## Base map selection

- The base map dropdown has an active background #efefef. Expand/collapse icons are provided
- The dropdown triggers a card with map preview thumbnails. Three or six - options to be advised by you
- Selected card is highlighted with slightly wider #777777 border
- Selecting a map thumbnail updates the main map canvas in real time
- Tapping the collapse icon reverts the dropdown to initial state (no background)

Icons:
icon-expand.svg
icon-collapse.svg

Visuals:
basemap


## New pin

- Tapping the new pin button beneath the map displays:
- A bar with, from left, active dropdown toggle, bar with default pin title (Pin 1), background #efefef with #777777 border, ‘centre map on this pin’ target icon
- Under the bar (which remains always visible) is a card with pin controls:

Search bar/manually add pin
- A location search bar with the placeholder text: Search or tap pin to add + search button (icon-go.svg)
- Note: users can search by address, place, postcode, GPS co-ordinates. Results are displayed in expanding dropdown beneath the search
- To the right of the search bar is a pushpin icon, which places a pin manually on the map

Icons:
icon-center.svg
Icon-go.svg
icon-pushpin.fill.svg

Visuals:
newpin1


**Pin selectors, size, colour**
- The are six pins (default icon-pin1-fill.svg). Selecting pins updates the pin on the map in real time. Pins are #777777 within #777777 boxes by default. When selected the pin and border take the colour selected below
- A simple but elegant slider bar (#999999) with rounded ends and button handle (#777777) to adjust pin size. The slider is sticky to five positions (1=small, 5=large). Default position is 3=medium). Display a visual indicator of pin size (1-5) while actively sliding, but hide feedback label when the user takes off their finger). The slider label to the left reads: Pin size.
- Opacity of the pin is controlled by a slider that is, by default, fully right (ie 100% opacity). Moving the button to the left reduces opacity in 10% steps, with visual feedback while dragging is in progress. The slider label to the left read: Opacity
- Colour selectors: SIX default solid colour buttons spaced evenly, with a border around the active colour (use #999999 border around white + #999999 border when active). The colours are:
#5422b0 (Default)
#02441F
#004269
#AB0000
#000000
#FFFFFF

Icons:
icon-pin1-fill.svg
icon-pin1.svg
icon-pin2-fill.svg
icon-pin2.svg
icon-pin3-fill.svg
icon-pin3.svg

Visuals:
newpin2

**Pin label**
- A Pin label toggle extends the new pin card with a further selection of controls
- An input window with placeholder text: Label text. As the user begins to type the label is displayed above the pin on the main canvas. (Moving the pin by dragging also moves the pin). 
- Note: ensure that tapping keyboard enter returns text onto a new line
- Note: Pin labels should be Inter Bold
- Label size slider. Same style as above, with label aligned left: Label size
- Make the slider sticky with just three sizes of label: Medium (default / centered), Small (left), Large (right)
- Label background. All labels text is WHITE text and has a background by default - a box with rounded corners, the same colour as the selected pin colour (purple by default)
- A different label background colour is selected by tapping in the row of colour selector buttons. The button selector colours are identical to those of the pin colour selectors
- Note: One exception … If a WHITE background is selected, change the default colour of text from white to #333333
- Opacity of the background is controlled by a slider that is, by default, fully right (ie 100% opacity). Moving the button to the left reduces opacity in 10% steps, with visual feedback while dragging is in progress. The slider label to the left read: Opacity
- Position. It is important that the label, if enabled, is dragged with the pin. No manual reposition of the label on the map canvas is therefore proposed. However, some slight repositioned may be necessary. To facilitate this, four direction buttons are added to the text label controls, moving the label up, down, left and right.

Icons
icon-left.svg
icon-right.svg
icon-up.svg
icon-down.svg


Visuals:
newpin4


## Project

- Visual project.png shows a project with two pins and labels (there could be multiple pins)
- The map can be centered on either of the pins by tapping the centre icon to the right of the map pin bars
- No inset map is active
- The Download and New Map buttons are active. White buttons with brand purple text and borders.


## Inset map

- The inset map toggle displays a card with inset map controls
- When active, a small map is displayed by default in the top right corner of the main map, with a default purple border, with rounded corners. Map defaults to user’s current position if possible.
- The inset map can ONLY be square. It will appear as a smaller map in one of the corners of the main map to add context. For example, the main map shows an incident on the border between two countries - the inset made shows the wider region or continent.
- the card displays, from top:
- Base style dropdown displays three only map options (very simple maps) displayed as horizontal thumbnails. (See inset2)
- Search bar Placeholder text: Search or pinch and drag preview map
- a preview map (updates actual inset map on main canvas). Square, smaller than viewport width and centered.
- Position icons (to position the inset map top left or right, bottom left or right)
- Border colour. Exact same palette as pin and label background colour buttons
- Size on main map. Slider, same style as elsewhere. Three sticky positions - Medium (centered, default), Small (left), Large (right)

Visuals
inset1
inset2

Icons
icon-right-up-fill.svg
icon-left-up.fill-svg
icon-right-down-fill.svg
icon-left-down-fill.svg


## Download / New Pin

- Saving automatically to device memory should begin when a pin is added to the main canvas
- From that point on, the Download and New Map button are visible at the bottom of the page - Tapping Download triggers the device native download modals
- Tapping New Map triggers an app modal on grey overlay. White background for modal. Modest shadow for definition. The modal has the following text (centered):
[Your maps (up to five)
are auto-saved for 30 days]
The modal also has a Cancel text button and ‘Start new map’ confirmation. When tapped the app reverts to initial view and the closed map can be viewed in the Saved tab.

Visuals
newpin


## Saved Tab

- The Saved tab is where the user finds maps auto-saved. The tab stores the last five maps created or edited. Maps before the most recent five are automatically deleted. Maps are saved for 30 days only to conserve device memory.
- The initial blank page (see saved1) carries the following centered placeholder text:

[No saved maps yet.
Maps are deleted after 30 days to conserve device memory
Deleting you cache may delete maps.]

- When maps are saved they are displayed as a list with the following elements:
- Thumbnail of map (square)
- Title. By default Map 1, Map 2 etc. With icon-pencil-fill.svg pencil icon to the right allowing users to rename the map
- Time/day the map was created, with icon.time.svg clock
- Number of pins on the map, displayed with icon-pushpin.svg
- three dot more button (icon-more.svg) aligned to the right
- separators between saved maps

Delete/Download/Edit

- See saved4
- Tapping the three-dot more menu  displays a toolbar under the saved map entry, pushing the separator line and following saved maps down.
- The toolbar is white background, #777777 border, with #333333 text + icon, in the following order, from left: [trash]|[Download]|[Edit] Note vertical separators
- When the Delete button is tapped, the toolbar extends to the left with a text Delete? Confirm button in brand purple, and the trash icon turns to icon-trash-fill.svg, colour brand purple). Confirming the deletion deletes the map and other saved maps fill the space.

Icons
icon-pencil-fill.svg
icon-time.svg
icon-pushpin.svg
icon-more.svg
icon-trash.svg
icon-trash-fill.svg


Visuals
saved1
saved2
saved3
saved4











