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

var PublicElectionsMap = {
	map: null,
	
	geoResult: null,
	
	electionCommissionsCollection: null,
	
	numActiveGeocoderCalls: 0,
	
	userNearestElectionCommission: null,
	
	userDistanceToNearestElectionCommission: null,
	
	initialPlace: null,
	
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
		PublicElectionsMap.map.addControl(new YMaps.Zoom());
		PublicElectionsMap.map.addControl(new YMaps.SearchControl({/*geocodeOptions: {geocodeProvider: "yandex#pmap"}, */width: 400}));
		
		// Показать на карте заданное место или расположение пользователя
		PublicElectionsMap.setDefaultViewport(place);
		
		// Отметим все избирательные комиссии на карте
		PublicElectionsMap.markElectionCommissions();
	},
	
	/**
	 * Центрирует карту над пользователем с максимальным масштабом.
	 * Если пользователь не из России, то карта центрируется над Москвой со средним масштабом.
	 * @param {place} - место, которое будет показано на карте. Если не задано, то для пользователя из России
	 * будет определено его местоположение и показано на карте с максимальным масштабом; для пользователя из-за рубежа
	 * карта будет отцентрована по европейской части России.
	 */
	setDefaultViewport: function(place) {
		if (place == null || place == "") { // Если место не задано место, то для пользователя из России будет определено его местоположение и показано на карте с максимальным масштабом;
							// для пользователя из-за рубежа карта будет отцентрована по европейской части России.
			var zoom = 5;
			var center;
			
			// Получение информации о местоположении пользователя. Подсчитываем координаты и уровень приближения.
			if (YMaps.location && YMaps.location.country == "Россия") {
				center = new YMaps.GeoPoint(YMaps.location.longitude, YMaps.location.latitude);

				if (YMaps.location.zoom)
					zoom = YMaps.location.zoom;

				PublicElectionsMap.map.openBalloon(center, "Место вашего предположительного местоположения:<br/>"
					+ (YMaps.location.country || "")
					+ (YMaps.location.region ? ", " + YMaps.location.region : "")
					+ (YMaps.location.city ? ", " + YMaps.location.city : "")
				)
			} else {
				center = new YMaps.GeoPoint(37.64, 55.76);
			}
			
			PublicElectionsMap.map.setCenter(center, zoom);
		} else {
			// если место задано, то оно будет показано на карте
			PublicElectionsMap.showAddress(place, false);
			PublicElectionsMap.initialPlace = place;
		}
	},
	
	/**
	 * Отмечает на карте все избирательные комиссии.
	 */
	markElectionCommissions: function() {
		// !!! ЗАМЕНИТЬ ЭТО НА СЕРВЕРНЫЙ ЗАПРОС !!!
		var electionCommissions = [
			{id: 1,
			shortTitle: "Адыгея",
			title: "ЦИК Республики Адыгея",
			address: "ул. Пионерская 199",
			city: "Майкоп",
			url: "http://www.adygei.izbirkom.ru/"},
			{id: 2,
			shortTitle: "Алтай",
			title: "ЦИК Республики Алтай",
			address: "ул. Эркемена Палкина, 1",
			city: "Горно-Алтайск",
			url: "http://www.altai_rep.izbirkom.ru/"},
			{id: 3,
			shortTitle: "Башкирия",
			title: "ЦИК Республики Башкортостан",
			address: "ул. Заки Валиди, 46",
			city: "Уфа"},
			{id: 4,
			shortTitle: "Бурятия",
			title: "ЦИК Республики Бурятия",
			address: "ул. Ленина, 54",
			city: "Улан-Удэ",
			url: "http://www.buriat.izbirkom.ru/"},
			{id: 5,
			shortTitle: "Дагестан",
			title: "ЦИК Республики Дагестан",
			address: "площадь им.В.И Ленина",
			city: "Махачкала",
			url: "http://www.dagestan.izbirkom.ru/"}
		];
		
		PublicElectionsMap.electionCommissionsCollection = new YMaps.GeoObjectCollection();
		
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
	 * Отмечает на карте заданную избирательную комиссию.
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
				PublicElectionsMap.map.addOverlay(placemark);
				PublicElectionsMap.electionCommissionsCollection.add(placemark);
				PublicElectionsMap.checkDistanceToUser(placemark);
			} else {
				Log.error("ID "+commission.id+": Адрес '"+addressString+"' не найден.<br/>");
			}
			
			PublicElectionsMap.numActiveGeocoderCalls--;
			if (PublicElectionsMap.numActiveGeocoderCalls <= 0)
				PublicElectionsMap.setDefaultUserZoom();
		});
		
		// При возникновении проблем со связью при поиске адреса ничего не делать.
		YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (geocoder) {
			PublicElectionsMap.numActiveGeocoderCalls--;
			if (PublicElectionsMap.numActiveGeocoderCalls <= 0)
				PublicElectionsMap.setDefaultUserZoom();
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
			if (this.length()) {
				PublicElectionsMap.map.setBounds(this.get(0).getBounds());
			}else {
				alert("Ничего не найдено. Извините, пожалуйста!")
			}
		});

		// Процесс геокодирования завершен с ошибкой
		YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (gc, error) {
			alert("Произошла ошибка: " + error);
		});
	},
	
	/**
	 * Выводит координаты всех избирательных комиссий в формате JSON: [{id,x,y},{id,x,y},...]
	 */
	writeElectionCommisionCoords: function() {
		Log.message("[");
		var placemark;
		for (var i=0; i < PublicElectionsMap.electionCommissionsCollection.length(); i++) {
			if (i > 0)
				Log.message(",");
			placemark = PublicElectionsMap.electionCommissionsCollection.get(i);
			Log.message("{id:"+placemark.id+",x:"+placemark.getCoordPoint().getX()+",y:"+placemark.getCoordPoint().getY()+"}");
		}
		Log.message("]");
	},
	
	/**
	 * Подсчитывает расстояние от центра карты до заданной метки и сохраняет его, если это минимальное расстояние.
	 * @param {placemark} [YMaps.Placemark] заданная метка
	 */
	checkDistanceToUser: function(placemark) {
		var user2PlacemarkDistance = Math.pow(PublicElectionsMap.map.getCenter().getX() - placemark.getCoordPoint().getX(), 2) +
									Math.pow(PublicElectionsMap.map.getCenter().getY() - placemark.getCoordPoint().getY(), 2);
									
		if (PublicElectionsMap.userNearestElectionCommission == null ||
			user2PlacemarkDistance < PublicElectionsMap.userDistanceToNearestElectionCommission) {
				PublicElectionsMap.userNearestElectionCommission = placemark;
				PublicElectionsMap.userDistanceToNearestElectionCommission = user2PlacemarkDistance;
		}
	},
	
	/**
	 * Эта функция устанавливает изначальный масштаб карты, на котором виден как минимум один избирательный округ.
	 */
	setDefaultUserZoom: function() {
		// не изменять масштабирование, если начальное место было указано
		if (PublicElectionsMap.initialPlace != null)
			return;
			
		// Отдалимся на величину, достаточную для отображения близлежайших избирательных комиссий
		var zoomOK = false;
		while (!zoomOK && PublicElectionsMap.map.getZoom() > 0) {
			if (PublicElectionsMap.map.getBounds().contains( PublicElectionsMap.userNearestElectionCommission.getCoordPoint() ))
				zoomOK = true;
			else
				PublicElectionsMap.map.zoomBy(-1);
		}
	}
};