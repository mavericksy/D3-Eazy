# D3-Eazy

TODO actually make it useful as a library.

Wrapper around D3 charts using the general update pattern.

Many thanks to Rob Moore at Toptal for his [Updatable Charts](https://www.toptal.com/d3-js/towards-reusable-d3-js-charts) article.

Using the library is pretty simple.

A simple bar chart can be created like this:

```javascript
  var el = 'wrapper-id';
  var dataset = [
    {key:'JS',value:32},
    {key:'GO',value:182},
    {key:'Rust',value:71},
    {key:'C',value:200},
    {key:'Zig',value:101},
    {key:'Common Lisp',value:400},
  ];
  var width = document.getElementById(el).offsetWidth;
  var height = document.getElementById(el).offsetHeight;
  var max = d3.max(dataset, d => d.value);
  var domain = d3.sort(dataset, d=> -d.value).map(d => d.key);
  //
  var TheBar = BarChartSimple()
  .SvgID("thebar")
  .Val(function(a) {return a.value})
  .Band(function(a) {return a.key})
  .Orient("vertical")
  .DomainBand(domain)
  .DomainVal([0,max])
  .ColourDomain(domain)
  .ColourRange(d3.schemeTableau10)
  .Width(width)
  .Height(height)
  .MarginTop(10)
  .MarginBottom(70)
  .MarginLeft(70)
  .MarginRight(30)
  .WithText(true)
  .BarLength(70)
  .FontDividend(4)
  .TextDeltaX(3)
  .TextDeltaY(4)
  .TextFill(["lightgrey","black"])
  .TextAnchor(["start", "end"])
  .Data(dataset);
  //
  d3.select("#"+el)
    .call(TheBar);
  // 
  // Updating the data can be initiated as such:
  function updateBar(data){
    TheBar.Data(data);
  }
```
