# Структура XML-шаблона листовки

Внутренний формат хранения проектов и шаблонов.

## Корневой элемент

```xml
<?xml version="1.0" encoding="UTF-8"?>
<flyer version="1.0" name="Название листовки">
  <page size="A4" orientation="portrait" width="794" height="1123">
    <background color="#ffffff"/>
    <elements>
      <!-- элементы -->
    </elements>
  </page>
</flyer>
```

## Атрибуты страницы (`page`)

| Атрибут | Описание |
|---------|----------|
| `size` | A4, A5, A3, Letter, custom |
| `orientation` | portrait, landscape |
| `width`, `height` | Размер в пикселях (96 DPI) |

## Текстовый элемент

```xml
<element id="t1" type="text" x="50" y="100" width="400" height="60" zIndex="0" locked="false">
  <text>Текст листовки</text>
  <style fontFamily="Arial" fontSize="24" color="#000000" align="center" bold="true" italic="false"/>
</element>
```

## Графический блок (rect)

```xml
<element id="r1" type="rect" x="0" y="0" width="200" height="100" zIndex="1">
  <style fill="#3b82f6" stroke="#000000" strokeWidth="2" opacity="1"/>
</element>
```

## Изображение

```xml
<element id="i1" type="image" x="100" y="200" width="300" height="200" zIndex="2">
  <source>/uploads/abc123.png</source>
</element>
```

## Общие атрибуты элемента

| Атрибут | Описание |
|---------|----------|
| `id` | Уникальный идентификатор |
| `type` | text, rect, image |
| `x`, `y` | Координаты (px) |
| `width`, `height` | Размеры (px) |
| `zIndex` | Порядок слоя |
| `locked` | true/false — блокировка редактирования |

## Расположение файлов

- Проекты: `backend/data/projects/*.xml`
- Шаблоны пользователя: `backend/data/templates/*.xml`
- Пресеты: `presets/*.xml`
