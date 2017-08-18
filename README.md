# kyDatagrid 

金越表格框架，基于 [jqury](https://jquery.com/) 开发，使用前需要引入 `jquery` 

设计理念参考 easyui 的 [datagrid](http://www.jeasyui.com/demo/main/index.php?plugin=DataGrid&theme=default&dir=ltr&pitem=&sort=)

兼容IE8+、Chrome、Firfox等主流浏览器

详细使用点击[这里](http://192.168.0.229/kingyea/js-plugin-kyDatagrid/wikis/home)

### 演示页面说明

由于Chrome浏览器限制。无法在本地文件中进行异步请求。建议查看demo时使用Firefox或者IE浏览器

### 使用方式

在页面中想要显示表格的地方写入表格代码。并指定一个 id 方便定位
```html
<table id="demoTable"></table>
```

然后，通过 js 确定获取数据的方式，以及数据绑定规则

```javascript
$("#demoTable").kyDatagrid({
    method: "get",
    url: 'data.json',
    idField: 'id',
    pagination: true,
    rownumbers: true,
    pageNumber: 1,
    pageSize: 15,
    columns: [
        {field: 'id', title: 'id', hidden: true},
        {field: 'name', title: '名称', width: 100, sortable: true},
        {
            field: 'status', title: '状态', width: 100,
            formatter: function (val, row, index) {
                switch (val) {
                    case "1" :
                        return "状态为一";
                        break;
                    case "2" :
                        return "状态为二";
                        break;

                }
            }
        },
        {
            field: 'oper', title: '操作', width: 100,
            formatter: function (val, row, index) {
                return "<a href='javascript:void(0)'>按钮</a>"
            }
        }
    ],
    onLoadSuccess: function () {
        alert("nothing to do...");
    },
    onDblClickRow: function (index, row) {
        alert("row index is " + index);
    }
});
```

到此，就可以完成表格的渲染了！

### 作者
Mushi <446559749@qq.com>
