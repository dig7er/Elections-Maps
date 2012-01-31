/**
 * Класс для отображения логов.
 */
var Log = {
	/**
	 * Метод для вывода сообщений об ошибке.
	 * Выведет сообщение только в том случае, если на странице есть элемент с id 'error'.
	 */
	error: function(message) {
		if (document.getElementById('error') != null)
			document.getElementById('error').innerHTML += message + "\n";
	},
	
	/**
	 * Метод для вывода логов.
	 * Выведет сообщение только в том случае, если на странице есть элемент с id 'message'.
	 */
	message: function(message) {
		if (document.getElementById('message') != null)
			document.getElementById('message').innerHTML += message + "\n";
	},
	
	clearMessage: function() {
		if (document.getElementById('message') != null)
			document.getElementById('message').innerHTML = "";
	},
	
	clearError: function() {
		if (document.getElementById('error') != null)
			document.getElementById('error').innerHTML = "";
	},
};

/**
 * Класс, объявляющий тип масштабирования.
 * @param {index} название типа масштабирования.
 * @param {value} уровень масштабирования для данного типа.
 */
var ZoomLevelType = function(index, value) {
	this.index = index;
	this.value = value;
};

/**
 * Класс для избирательных округов
 * @param {level} уровень избирательного округа (от 1 до 3)
 */
var ElectionCommission = function(id, level, shortTitle, title, address, city, url, numVoters, numObservers, numLinks) {
	this.id = id;
	this.level = level < 1 ? 1 : level > 3 ? 3 : level;
	this.shortTitle = shortTitle;
	this.title = title;
	this.address = address;
	this.city = city;
	this.url = url;
	this.numVoters = numVoters < 0 ? 0 : numVoters;
	this.numObservers = numObservers < 0 ? 0 : numObservers;
	this.numLinks = numLinks < 0 ? 0 : numLinks;
};

/**
 * Именованная область видимости для общественной карты выборов.
 */
var PublicElectionsMap = {
	map: null,
	
	geoResult: null,
	
	electionCommissionsCollection: null,
	
	numActiveGeocoderCalls: 0,
	
	buttons: null,
	
	/**
	 * Переменная, в которой заданы все типы масштабирования для карты.
	 */
	MAP_LEVELS: new Array(
		new ZoomLevelType("ЦИК", 0),
		new ZoomLevelType("ИКСы", 4),
		new ZoomLevelType("ТИКи", 10)
	),
	
	/**
	 * Добавляем Народную Яндекс.Карту на страницу и отмечаем на ней все избирательные комиссии.
	 */
	init: function(place) {
		PublicElectionsMap.map = new YMaps.Map( document.getElementById("publicElectionsMap") );
		PublicElectionsMap.map.setType(YMaps.MapType.PMAP);
		PublicElectionsMap.map.enableScrollZoom();
		
		PublicElectionsMap.numActiveGeocoderCalls = 0;
	
		// Переименовываем типы карт, чтобы их можно было различать. Народные карты имеют индекс 1, обычные - индекс 2.
		YMaps.MapType.PMAP.setName("Схема 1");
		YMaps.MapType.MAP.setName("Схема 2");
		YMaps.MapType.PHYBRID.setName("Гибрид 1");
		YMaps.MapType.HYBRID.setName("Гибрид 2");
		PublicElectionsMap.map.addControl(new YMaps.TypeControl([YMaps.MapType.PMAP, YMaps.MapType.MAP, YMaps.MapType.SATELLITE, YMaps.MapType.PHYBRID, YMaps.MapType.HYBRID,], [0,1,2,3,4])); // объявляем доступные типы карт
		PublicElectionsMap.map.addControl(new YMaps.ToolBar());
		PublicElectionsMap.map.addControl(new YMaps.Zoom({
													customTips: PublicElectionsMap.MAP_LEVELS
												}));
		PublicElectionsMap.map.addControl(new YMaps.SearchControl({/*geocodeOptions: {geocodeProvider: "yandex#pmap"}, */width: 400}));
		
		// Показать на карте заданное место
		PublicElectionsMap.setDefaultViewport(place);
		
		// Считаем все избирательные комиссии на карте
		PublicElectionsMap.markElectionCommissions();
		
		PublicElectionsMap.addButtons();
	},
	
	/**
	 * Центрирует карту на указанном месте с оптимальным масштабом.
	 * @param {place} - место, которое будет показано на карте. Если не задано, то будет показана вся Россия
	 */
	setDefaultViewport: function(place) {
		if (place == null || place == "") { // Если место не задано место, то будет показана вся Россия
			var zoom = 3;
			var center = new YMaps.GeoPoint(95, 65);
			PublicElectionsMap.map.setCenter(center, zoom);
		} else
			// если место задано, то оно будет показано на карте
			PublicElectionsMap.showAddress(place, false);
	},
	
	/**
	 * Отмечает на карте все избирательные комиссии.
	 */
	markElectionCommissions: function() {
		// !!! ЗАМЕНИТЬ ЭТО НА СЕРВЕРНЫЙ ЗАПРОС !!!
		var electionCommissions = new Array(
			new ElectionCommission(1, 1, "Адыгея", "ЦИК Республики Адыгея", "ул. Пионерская 199", "Майкоп", "http://www.adygei.izbirkom.ru/", 500, 5, 10),
			new ElectionCommission(2, 2, "Алтай", "ЦИК Республики Алтай", "ул. Эркемена Палкина, 1", "Горно-Алтайск", "http://www.altai_rep.izbirkom.ru/", 1000, 10, 20),
			new ElectionCommission(3, 2, "Башкирия", "ЦИК Республики Башкортостан", "ул. Заки Валиди, 46", "Уфа", null, 1500, 15, 30),
			new ElectionCommission(4, 3, "Бурятия", "ЦИК Республики Бурятия", "ул. Ленина, 54", "Улан-Удэ", "http://www.buriat.izbirkom.ru/", 1000, 10, 20),
			new ElectionCommission(5, 3, "Дагестан", "ЦИК Республики Дагестан", "площадь им.В.И Ленина", "Махачкала", "http://www.dagestan.izbirkom.ru/", 500, 5, 10)
		);
		
		// Define an election commissions collection for three types of election commissions
		PublicElectionsMap.electionCommissionsCollection = new Array(new Array(), new Array(), new Array());
		
		var address;
		for (var n in electionCommissions)
		{
			address = [];
			if (electionCommissions[n].city != null && electionCommissions[n].city != "")
				address.push(electionCommissions[n].city);
			if (electionCommissions[n].address != null && electionCommissions[n].address != "")
				address.push(electionCommissions[n].address);
			
			PublicElectionsMap.markElectionCommission(address.join(", "), electionCommissions[n]);
		}
	},
	
	/**
	 * Создаёт метку для заданной избирательной комиссии и сохраняет её в коллекцию меток.
	 * @param {addressString} строка адреса формата "Город, удица №Дома"
	 * @param {commission} объект типа ElectionCommission
	 */
	markElectionCommission: function(addressString, commission) {
		// Запускает асинхронный поиск адреса
		var geocoder = new YMaps.Geocoder(addressString, {results: 1, geocodeProvider: "yandex#pmap"});
		PublicElectionsMap.numActiveGeocoderCalls++;
		
		// Объявляем callback-функцию для поиска адреса
		YMaps.Events.observe(geocoder, geocoder.Events.Load, function (geocoder) {
			var addressParts = addressString.split(" ");
			if (this.length() == 0 && addressParts.length > 1) {
				// если адрес не найден, попробуем найти снова, но без указания номера дома
				addressParts.pop(); // remove the last element from the array
				PublicElectionsMap.markElectionCommission(addressParts.join(" "), commission);
				Log.error("ID "+commission.id+": Адрес '"+addressString+"' не найден (пробуем следующий '"+addressParts.join(" ")+"')<br/>");
			} else if (this.length() > 0) {
				// создаём метку для избирательной комиссии с именем и описанием
				var placemark = new YMaps.Placemark(this.get(0).getCoordPoint());
				placemark.name = commission.title;
				placemark.description = PublicElectionsMap.buildAddressString(commission.city, commission.address) +
										' <a href="#" onclick="PublicElectionsMap.showAddress(\''+addressString+'\', true); return false;"><img src="target.png" alt="Цель" title="Найти на карте" style="position: relative; bottom: -3px;" /></a>' +
										((commission.url != null && commission.url.length > 0) ?"<p>Сайт: <a href=\""+commission.url+"\" target=\"_blank\">"+commission.url+"</a></p>":"");
				placemark.setIconContent(commission.shortTitle);
				placemark.id = commission.id;
				placemark.level = commission.level;
				placemark.shortTitle = commission.shortTitle;
				placemark.numVoters = commission.numVoters;
				placemark.numObservers = commission.numObservers;
				placemark.numLinks = commission.numLinks;
				PublicElectionsMap.electionCommissionsCollection[commission.level-1].push(placemark);
			} else {
				Log.error("ID "+commission.id+": Адрес '"+addressString+"' не найден.<br/>");
			}
			
			PublicElectionsMap.numActiveGeocoderCalls--;
			if (PublicElectionsMap.numActiveGeocoderCalls <= 0)
				PublicElectionsMap.showElectionCommissionMarks();
		});
		
		// При возникновении проблем со связью при поиске адреса ничего не делать.
		YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (geocoder) {
			PublicElectionsMap.numActiveGeocoderCalls--;
			if (PublicElectionsMap.numActiveGeocoderCalls <= 0)
				PublicElectionsMap.showElectionCommissionMarks();
		});
	},
	
	/**
	 * Составляет читабельную адресную строку формата "Город, улица №дома"
	 * @param {city} имя города
	 * @param {address} улица и номер дома
	 * @returns строку формата "Город, улица №дома"
	 */
	buildAddressString: function(city, address) {
		var addressParts = [];
		if (city != "" && city != null)
			addressParts.push(city);
		if (address != "" && address != null)
			addressParts.push(address);
			
		return addressParts.join(", ");
	}, 
	
	/**
	 * Функция для отображения результата геокодирования на карте.
	 * @param {value} - адрес объекта для поиска
	 * @param {peoplesMap} - [boolean] true, поиск по Народной Карте Яндекс; false, поиск по обычной Карте Яндекс
	 */
	showAddress: function(value, peoplesMap) {
		// Запускает процесс геокодирования
		var geocodeProviderValue = peoplesMap ? "yandex#pmap" : "yandex#map";
		var geocoder = new YMaps.Geocoder(value, {geocodeProvider: geocodeProviderValue});

		// Создает обработчик успешного завершения геокодирования
		YMaps.Events.observe(geocoder, geocoder.Events.Load, function () {
			// Если объект найден, устанавливает центр карты в центр области показа объекта
			if (this.length())
				PublicElectionsMap.map.setBounds(this.get(0).getBounds());
			else
				alert("Ничего не найдено. Извините, пожалуйста!");
		});

		// Процесс геокодирования завершен с ошибкой
		YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (gc, error) {
			alert("Произошла ошибка: " + error);
		});
	},
	
	/**
	 * Добавляет на карту 3 кнопки "Изибиратели", "Наблюдатели", "Ссылки".
	 */
	addButtons: function() {
		var button;
		var buttons = new Array();

		// Кнопка "Избиратели"
		button = new YMaps.ToolBarButton({caption: "Избиратели", hint: "Показывает количество избирателей на избирательных округах"});
		YMaps.Events.observe(button, button.Events.Click, PublicElectionsMap.votersButtonClickHandler, buttons);
		buttons.push( button );
		
		// Кнопка "Наблюдатели"
		button = new YMaps.ToolBarButton({caption: "Наблюдатели", hint: "Показывает количество наблюдателей на избирательных округах"});
		YMaps.Events.observe(button, button.Events.Click, PublicElectionsMap.observersButtonClickHandler, buttons);
		buttons.push( button );
		
		// Кнопка "Ссылки"
		button = new YMaps.ToolBarButton({caption: "Ссылки", hint: "Показывает количество ссылок на избирательных округах"});
		YMaps.Events.observe(button, button.Events.Click, PublicElectionsMap.linksButtonClickHandler, buttons);
		buttons.push( button );
		
		PublicElectionsMap.map.addControl(new YMaps.ToolBar(buttons), new YMaps.ControlPosition(YMaps.ControlPosition.BOTTOM_LEFT, new YMaps.Point(10, 10)));
	},
	
	/**
	 * Описывает функционал кнопки "Избиратели"
	 * @param {button} объект нажатой кнопки "Избиратели"
	 */
	votersButtonClickHandler: function (button) {
		if (button.isSelected()) {
			for (var num in PublicElectionsMap.electionCommissionsCollection)
				for (var i in PublicElectionsMap.electionCommissionsCollection[num])
					PublicElectionsMap.electionCommissionsCollection[num][i].setIconContent( PublicElectionsMap.electionCommissionsCollection[num][i].shortTitle );
			button.deselect()
		} else {
			for (var num in PublicElectionsMap.electionCommissionsCollection)
				for (var i in PublicElectionsMap.electionCommissionsCollection[num])
					PublicElectionsMap.electionCommissionsCollection[num][i].setIconContent( PublicElectionsMap.electionCommissionsCollection[num][i].numVoters );
			for (var num in this)
				this[num].deselect();
			button.select();
		}
	},
	
	/**
	 * Описывает функционал кнопки "Наблюдатели"
	 * @param {button} объект нажатой кнопки "Наблюдатели"
	 */
	observersButtonClickHandler: function (button) {
		if (button.isSelected()) {
			for (var num in PublicElectionsMap.electionCommissionsCollection)
				for (var i in PublicElectionsMap.electionCommissionsCollection[num])
					PublicElectionsMap.electionCommissionsCollection[num][i].setIconContent( PublicElectionsMap.electionCommissionsCollection[num][i].shortTitle );
			button.deselect()
		} else {
			for (var num in PublicElectionsMap.electionCommissionsCollection)
				for (var i in PublicElectionsMap.electionCommissionsCollection[num])
					PublicElectionsMap.electionCommissionsCollection[num][i].setIconContent( PublicElectionsMap.electionCommissionsCollection[num][i].numObservers );
			for (var num in this)
				this[num].deselect();
			button.select();
		}
	},
	
	/**
	 * Описывает функционал кнопки "Ссылки"
	 * @param {button} объект нажатой кнопки "Ссылки"
	 */
	linksButtonClickHandler: function (button) {
		if (button.isSelected()) {
			for (var num in PublicElectionsMap.electionCommissionsCollection)
				for (var i in PublicElectionsMap.electionCommissionsCollection[num])
					PublicElectionsMap.electionCommissionsCollection[num][i].setIconContent( PublicElectionsMap.electionCommissionsCollection[num][i].shortTitle );
			button.deselect()
		} else {
			for (var num in PublicElectionsMap.electionCommissionsCollection)
				for (var i in PublicElectionsMap.electionCommissionsCollection[num])
					PublicElectionsMap.electionCommissionsCollection[num][i].setIconContent( PublicElectionsMap.electionCommissionsCollection[num][i].numLinks );
			for (var num in this)
				this[num].deselect();
			button.select();
		}
	},
	
	/**
	 * Определяет и показывает на карте нужный уровень избирательных комиссий согласно масштабу.
	 */
	showElectionCommissionMarks: function() {
		// Создание диспетчера объектов и добавление его на карту
		var objManager = new YMaps.ObjectManager();
		PublicElectionsMap.map.addOverlay(objManager);
		for (var num=0; num < PublicElectionsMap.electionCommissionsCollection.length; num++)
			if (num < PublicElectionsMap.MAP_LEVELS.length)
				objManager.add(
					PublicElectionsMap.electionCommissionsCollection[num],
					PublicElectionsMap.MAP_LEVELS[num].value,
					(num >= PublicElectionsMap.MAP_LEVELS.length-1) ? 19 : (PublicElectionsMap.MAP_LEVELS[num+1].value - 1)
				);
	},
	
	/**
	 * Выводит координаты всех избирательных комиссий в формате JSON: [{id,x,y},{id,x,y},...]
	 */
	writeElectionCommisionCoords: function() {
		Log.message("[");
		var placemark;
		for (var num in PublicElectionsMap.electionCommissionsCollection)
			for (var i=0; i < PublicElectionsMap.electionCommissionsCollection[num].length; i++) {
				if (i > 0)
					Log.message(",");
				placemark = PublicElectionsMap.electionCommissionsCollection[num][i];
				Log.message("{id:"+placemark.id+",x:"+placemark.getCoordPoint().getX()+",y:"+placemark.getCoordPoint().getY()+"}");
			}
		Log.message("]");
	}
};