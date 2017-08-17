/**
 * Kingyea Datagrid (v1.0)
 * 金越自定义表格插件，根据 easyui 的 datagrid 进行设计
 * 使用 jquery 实现
 * @author: Mushi(hu_mushi@163.com) 2017年5月16日
 *
 */
(function ($) {

    /**
     * 定义kyDatagrid方法
     * 根据参数类型判断 “初始化表格” 还是 “调用方法“
     */
    $.fn.kyDatagrid = function (options, param) {
        // 类型为 string 表示调用方法
        if (typeof options == 'string') {
            return $.fn.kyDatagrid.methods[options](this, param);
        }

        // 不为 string 时初始化表格
        options = options || {};
        return this.each(function () {
            // jQuery.data( element )
            // jQuery.data( element, key )
            // jQuery.data( element, key, value )
            // 获取当前对象存放的 kyDatagrid 数据值,为undefined表示未初始化,否则表示已经初始化过
            var state = $.data(this, 'kyDatagrid');

            if (state) {  // 不为 undefined 表示初始化过
                // jQuery.extend( target [, object1 ] [, objectN ] )
                // 将两个或更多对象的内容合并到第一个对象。
                $.extend(state.options, options);
            } else {      // 初始化
                options = $.extend({}, $.fn.kyDatagrid.defaults, $.fn.kyDatagrid.parseOptions(this), options);
                // 设置表格配置
                $.data(this, 'kyDatagrid', {options: options});
                init(this);
                reload(this);
            }
        });
    };

    /** 表格默认配置 */
    $.fn.kyDatagrid.defaults = {
        title: undefined,
        url: undefined,
        idField: "id",
        method: 'post',
        queryParams: {},
        fit: false,
        enableChecked: false,
        columns: undefined,
        rownumbers: true,                 // 显示行号
        pagination: true,                 // 是否分页
        pageNumber: 1,
        singleSelect: true,
        pageSize: 10,
        scrollBarWidth: 18,
        pageList: [10, 20, 30, 40, 50],
        maxPageLen: 10,
        emptyMsg: '记录为空!',
        onLoadSuccess: function (rows) {
        },
        onLoadError: function () {
        },
        onDblClickRow: function (index, row) {
        },
        onSelect: function (index, row) {
        },
        onUnSelect: function (index, row) {
        },
        onSelectAll: function (rows) {
        },
        onUnSelectAll: function (rows) {
        }
    };

    /** 表格方法路由 */
    $.fn.kyDatagrid.methods = {
        options: function (jq) {
            return $.data(jq[0], 'kyDatagrid').options;
        },
        reload: function (jq, params) {
            return jq.each(function () {
                reload(this, params);
            });
        },
        remove: function (jq) {
            return jq.each(function () {
                removeTable(this);
            });
        },
        getSelected: function (jq) {
            return getSelected(jq[0]);
        },
        getSelections: function (jq) {
            return $.data(jq[0], "kyDatagrid").selectedRows || [];
        },
        checkRow: function (jq, index) {
            return jq.each(function () {
                checkRow(this, index);
            });
        },
        checkAll: function (jq) {
            return jq.each(function () {
                checkAll(this);
            });
        },
        unCheckRow: function (jq, index) {
            return jq.each(function () {
                unCheckRow(this, index);
            });
        },
        unCheckAll: function (jq) {
            return jq.each(function () {
                unCheckAll(this);
            });
        },
        loadData: function (jq, data) {
            return jq.each(function () {
                loadData(this, data);
            })
        }
    };

    /** 格式化表格参数 */
    $.fn.kyDatagrid.parseOptions = function (target) {
        return {};
    };

    // 创建表格
    function createTable(target, rows, options) {
        // 返回的数据量比 pageSize 大时截取返回结果
        if (options.pagination && rows.length > options.pageSize) {
            rows = rows.slice(0, options.pageSize);
        }

        var emptyRows = [];
        var emptyLen = options.pageSize - rows.length;
        while (emptyLen-- > 0) {
            emptyRows.push("");
        }

        $(target).wrap($("<div class='kyDatagrid-wrap'></div>")).wrap("<div class='kyDatagrid-view'></div>");

        $(target).append(writeTableHead(target));
        $(target).append(writeTableBody(target, rows));
        $(target).addClass("data-table kyDatagrid");

        var selectedRows = $.data(target, 'kyDatagrid').selectedRows || [];
    }

    // 创建分页
    function createPagination(target, totalCount, options) {
        $(target).parents(".kyDatagrid-wrap").find(".pagination").remove();

        var kyDatagridPanel = $(target).parents(".kyDatagrid-wrap");
        // 获取分页相关参数
        var totalCount = parseInt(totalCount);           // 总记录数
        var pageNo = parseInt(options.pageNumber);       // 当前页数
        var maxPageLen = parseInt(options.maxPageLen);   // 页码长度
        var pageSize = parseInt(options.pageSize);       // 每页大小
        // 计算总页数
        var totalPage = (totalCount % pageSize == 0) ? totalCount / pageSize : (parseInt(totalCount / pageSize) + 1);

        maxPageLen = totalPage > maxPageLen ? maxPageLen : totalPage;

        var begin = 1;
        // 比如 pageNo = 4 ,maxPageLen = 10, totalPage = 12
        // 那么分页应该显示的是 1,2,3...,10
        // 这种用于页码比较小,刚开始的时候
        if (pageNo < maxPageLen / 2) {
            begin = 1;
        }
        // 比如 pageNo = 9 ,maxPageLen = 10, totalPage = 12
        // 那么分页应该显示的是 3,4,5...,12
        // 这种用于页码比较大,快到总页数的时候
        else if ((totalPage - pageNo) < maxPageLen / 2) {
            begin = totalPage - maxPageLen + 1;
        }
        // 其他情况都是以当前页减去maxLenth的一半作为开始
        // 比如 pageNo = 15 ,maxPageLen = 10, totalPage = 50
        // 那么分页应该显示的是 10,11,12...,19
        else {
            begin = pageNo - parseInt(maxPageLen / 2);
        }
        begin = begin > 0 ? begin : 1;
        // 分页页码数组
        var pageScope = [];
        var len = begin + maxPageLen;
        for (begin; begin < len; begin++) {
            pageScope.push(begin);
        }

        // 计算启示和结束行号
        var rowBegin = totalCount > 0 ? (pageNo - 1) * pageSize + 1 : 0;
        var rowEnd = pageNo * pageSize > totalCount ? totalCount : pageNo * pageSize;

        var pagination = $("<div class='pagination'></div>");

        pagination.append('<div class="left list-show">显示第' + rowBegin + '到' + rowEnd + '条，共' + totalCount + '条</div>');
        // 创建分页列表 ul
        var ul = $('<ul class="right page-box"></ul>');
        // region // 上一页
        var preLi = $("<li class='pre'><a href='javascript:void(0)'>上一页</a></li>");
        preLi.attr("pageno", pageNo - 1);
        if (pageNo <= 1) {
            preLi.find("a").addClass("hui");
        }
        ul.append(preLi);
        // endregion
        for (var i = 0; i < pageScope.length; i++) {
            var curPage = pageScope[i];
            var pageLi = $("<li class='num'><a href='javascript:void(0)'></a></li>");
            pageLi.attr("pageno", curPage);
            pageLi.find("a").html(curPage);
            if (curPage == pageNo) {
                pageLi.addClass("active");
            }
            ul.append(pageLi);
        }

        // region // 下一页
        var nextLi = $("<li class='next'><a href='javascript:void(0)'>下一页</a></li>");
        nextLi.attr("pageno", pageNo + 1);
        if (pageNo >= totalPage) {
            nextLi.find("a").addClass("hui");
        }
        ul.append(nextLi);
        // endregion


        // ul.append('<li class="pre" pageno="' + pageNo - 1 + '"><a class="{{if pageNo <= 1}}hui{{/if}}" href="javascript:void(0)">上一页</a></li>');
        pagination.append(ul);
        pagination.append("<div class='clearfix'></div>");
        pagination.empty();
        pagination.append(
            '<div class="page-box">' +
            '<div class="left show-g"> ' +
            '<ul>' +
            '<li> <select class="select mart-5"> <option>10</option> <option>20</option> <option>30</option> </select> </li>' +
            '<li> <a href="#" class="btn-leftt"></a> <a href="#" class="btn-left"></a> </li> ' +
            '<li>第 <select class="select marb-3"> <option>1</option> <option>2</option> </select> 共2页 </li>' +
            '<li> <a href="#" class="btn-right"></a> <a href="#" class="btn-rightt"></a> </li> ' +
            '<li> <a href="#" class="btn-rf"></a> </li> ' +
            '</ul> ' +
            '</div> ' +
            '<div class="num-show right">显示第1到15条，共151条</div> </div>');

        $(kyDatagridPanel).append(pagination);


        // 绑定翻页事件
        $(kyDatagridPanel).find(".pagination .page-box li a").on("click", function () {
            // 表示按钮不可点
            if ($(this).hasClass("hui") || $(this).hasClass("cur")) {
                return;
            }
            // 获取要跳转的页面
            var pageno = $(this).parent().attr("pageno");
            // 当前页也不能点
            if (pageno == pageNo) {
                return;
            }
            // 跳转页面
            else {
                var options = $(target).kyDatagrid('options');
                options.pageNumber = pageno;
                // 获取表格配置及参数
                var kyDatagridData = $.data(target, 'kyDatagrid');
                // 更新表格配置
                kyDatagridData.options = options;
                // 更新存放的 data
                $.data(target, 'kyDatagrid', kyDatagridData);
                $(target).kyDatagrid('reload');
            }
        })
    }

    // 初始化表格结构
    function init(target) {
        var options = $(target).kyDatagrid('options');

        $(target).css("display", "none");
        // 创建包裹结构
        $(target).wrap($("<div class='kyDatagrid-wrap'></div>"))
            .wrap("<div class='kyDatagrid-view'></div>");

        // 获取外层各对象
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        var kyDatagridView = kyDatagridWrap.find(".kyDatagrid-view");
        kyDatagridView.append("<div class='kyDatagrid-header'>")
            .append("<div class='kyDatagrid-body'>");
        kyDatagridView.find(".kyDatagrid-header").append("<table class='data-table'>");
        kyDatagridView.find(".kyDatagrid-header table").append(writeTableHead(target));

        kyDatagridView.find(".kyDatagrid-body").append("<table class='data-table'>");

        if (options.pagination) {
            createPagination(target, 0, options);
        }
    }

    // 更新表格
    function reload(target, params) {
        // 获取表格基本配置
        var options = $.data(target, 'kyDatagrid').options;

        // 传入参数不为空时,不保存原来的查询条件
        if (params != undefined && typeof params == "object") {
            options.queryParams = params;
        }
        // 获取查询条件
        var queryParams = options.queryParams, params;
        // 是否分页
        if (options.pagination) {
            $.extend(queryParams, {page: options.pageNumber, rows: options.pageSize});
        }

        // ajax加载数据
        // 返回结果 json 格式为 {total:0,rows:[]}
        // 其中 total 为总记录数 ， rows 为列表数组数据,里面每行json表示一行数据
        $.ajax({
            url: options.url,
            type: options.method,
            data: queryParams,
            dataType: 'json',
            success: function (data) {
                loadData(target, data);
                // 回调 onloadSuccess 方法
                options.onLoadSuccess(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                loadData(target, []);
                // 回调 onLoadError 方法
                options.onLoadError();
            }
        });
    }

    // 加载数据
    function loadData(target, data) {
        var options = $(target).kyDatagrid('options');
        var data = formatResult(options, data);
        $(target).siblings(".kyDatagrid-body").find("table").empty().append(writeTableBody(target, data.rows));

        // 更新表格配置
        var kyDatagridData = $.data(target, 'kyDatagrid');
        kyDatagridData.options = options;
        kyDatagridData.rows = data.rows;
        $.data(target, 'kyDatagrid', kyDatagridData);
        // 绑定事件
        bindEvent(target);
        // 设置表格高度
        setTableHeight(target);
        // 设置列宽
        setColWidth(target);
    }

    // 移除表格
    function removeTable(target) {
        if ($(target).parents(".kyDatagrid-wrap").length > 0) {
            $(target).unwrap().unwrap();
        }
        $(target).html("");
        $(target).next(".pagination").remove();
    }

    // 绑定事件
    function bindEvent(target) {
        var options = $(target).kyDatagrid('options');
        // 绑定表头排序事件
        $(target).siblings(".kyDatagrid-header").find("th.sortable").unbind("click").click(function (event) {
            var order = "desc";
            var field = $(this).attr("field");
            // 只有当前元素是降序排序时才更新为升序，否则默认为降序排序
            if ($(this).hasClass("down")) {
                order = "asc";
            }
            $(target).siblings(".kyDatagrid-header").find("th.sortable").removeClass("down").removeClass("up");
            if (order == "asc") {
                $(this).addClass("up");
            } else {
                $(this).addClass("down");
            }

            var queryParam = $.data(target, "kyDatagrid").options.queryParams;
            queryParam.sort = field;
            queryParam.order = order;
            reload(target, queryParam);
        });
        // 绑定行单击事件
        $(target).siblings(".kyDatagrid-body").find(".kyDatagrid-row").unbind("click").click(function (event) {
            // 表示空行,不进行任何操作
            if ($(this).hasClass("empty-row")) {
                return;
            }
            var rows = $.data(target, "kyDatagrid").rows;
            var index = $(this).attr("index");

            if (options.singleSelect) {
                if (isChecked(target, index)) {
                    unCheckAll(target);
                } else {
                    unCheckAll(target);
                    checkRow(target, index);
                }
            } else if (!$(this).hasClass("selected")) {
                checkRow(target, index);
            } else {
                unCheckRow(target, index);
            }
        });
        // 绑定行双击事件
        $(target).siblings(".kyDatagrid-body").find(".kyDatagrid-row").unbind("dblclick").dblclick(function (event) {
            var rows = $.data(target, "kyDatagrid").rows;
            var index = $(this).attr("index");
            $.data(target, "kyDatagrid").options.onDblClickRow(index, rows[index]);
        });
        // 绑定 全选/取消全选 事件
        if (options.enableChecked) {
            $(target).siblings(".kyDatagrid-header").find("#kyDatagridAllCheckbox").unbind("click").click(function () {
                // 单选时禁止全选按钮事件
                if (options.singleSelect) {
                    $(this).prop('checked', false);
                } else {
                    if (!$(this).prop("checked")) {
                        unCheckAll(target);
                    } else {
                        checkAll(target);
                    }
                }
            });
        }

        // resize 设置列宽
        $(window).resize(function () {
            setTableHeight(target);
            setColWidth(target);
        });
    }

    // 设置表格高度自适应
    function setTableHeight(target) {
        var options = $(target).kyDatagrid('options');
        if (options.fit) {
            // 测试定位,目前只能在一个页面只有一个表格时生效。第二个表格的高度会变成0
            var screenHeight = $(window).height();
            var offsetTop = $(target).parents('.kyDatagrid-wrap').offset().top;
            $(target).parents('.kyDatagrid-wrap').css('height', screenHeight - offsetTop);
            $(target).parents('.kyDatagrid-view').css('height', screenHeight - offsetTop - 31);
            $(target).siblings(".kyDatagrid-header").css("height", 35 * getMaxDeepLength(options.columns));
            $(target).siblings('.kyDatagrid-body').css('height', screenHeight - offsetTop - 35 * getMaxDeepLength(options.columns) - 31);
        }
    }

    // 设置列宽自适应
    function setColWidth(target) {
        var options = $(target).kyDatagrid('options');

        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        var maxWidth = kyDatagridWrap.width();

        var frozenColWidth = kyDatagridWrap.find(".kyDatagrid-header th.frozenCol").length;

        kyDatagridWrap.find(".kyDatagrid-header").css("width", maxWidth);
        kyDatagridWrap.find(".kyDatagrid-body").css("width", maxWidth);
        kyDatagridWrap.find(".kyDatagrid-header table").css("width", maxWidth - options.scrollBarWidth);
        kyDatagridWrap.find(".kyDatagrid-body table").css("width", maxWidth - options.scrollBarWidth);

        // TODO 这里36是每列宽度。后期需要修改。左侧做成frozenCol
        maxWidth = maxWidth - 36 * frozenColWidth - options.scrollBarWidth;
        var realColumns = getRealColumns(options.columns);
        var totalWidth = getTotalWidth(realColumns);
        // 列宽度样式表
        var styleSheet = [];
        // 遍历设置每列宽度
        for (var i = 0; i < realColumns.length; i++) {
            var column = realColumns[i];
            if (column.hidden == undefined || !column.hidden) {
                var columnWidth = column.width == undefined ? 100 : column.width;
                var columnKey = ".kyDatagrid-cl-" + column.field;
                var width = parseInt(columnWidth / totalWidth * maxWidth) - 12;
                styleSheet.push("" + columnKey + " {width:" + width + "px}");
            }
        }

        writeStyleSheet(target, styleSheet);
    }

    // 判断行是否被选中
    function isChecked(target, index) {
        var row = $(target).siblings(".kyDatagrid-body").find("#kyDatagrid-row-" + index);
        // 表示已经选中，不做任何操作
        if (row.hasClass("selected")) {
            return true;
        }
        return false;
    }

    // 选中指定行
    function checkRow(target, index) {
        // region // 更新选中状态
        var row = $(target).siblings(".kyDatagrid-body").find("#kyDatagrid-row-" + index);
        // 表示已经选中，不做任何操作
        if (row.hasClass("selected")) {
            return;
        }
        row.addClass("selected");

        var kyDatagridData = $.data(target, 'kyDatagrid');
        var rows = kyDatagridData.rows || [];
        var selectedRows = kyDatagridData.selectedRows || [];
        var options = kyDatagridData.options;
        // endregion

        // region // 只有启用了复选框功能该方法才生效
        if (options.enableChecked) {
            row.find(".kyDatagridCheckbox").prop("checked", true);
        }
        // endregion

        var idField = options.idField;
        var isExist = false;
        for (var i = 0; i < selectedRows.length; i++) {
            if (selectedRows[i][idField] == rows[index][idField]) {
                isExist = true;
            }
        }
        if (!isExist) {
            selectedRows.push(rows[index]);
            kyDatagridData.selectedRows = selectedRows;
        }
        // 更新选中行数据
        $.data(target, 'kyDatagrid', kyDatagridData);

        // region // 全选时设置表格的 全选 框为选中
        var isAllChecked = true;
        for (var i = 0; i < rows.length; i++) {
            if (!$("#kyDatagrid-row-" + i).find(".kyDatagridCheckbox").prop("checked")) {
                isAllChecked = false;
            }
        }
        if (isAllChecked) {
            $(target).siblings(".kyDatagrid-header").find("#kyDatagridAllCheckbox").prop("checked", true);
            options.onSelectAll(rows);
        }
        // endregion
        options.onSelect(index, rows[index]);
    }

    // 取消选中指定行
    function unCheckRow(target, index) {
        // 首先更新选中状态
        var row = $(target).siblings(".kyDatagrid-body").find("#kyDatagrid-row-" + index);
        // 表示没有被选中，不做任何操作
        if (!row.hasClass("selected")) {
            return;
        }
        row.removeClass("selected");

        var kyDatagridData = $.data(target, 'kyDatagrid');
        var rows = kyDatagridData.rows == undefined ? [] : kyDatagridData.rows;
        var selectedRows = kyDatagridData.selectedRows == undefined ? [] : kyDatagridData.selectedRows;
        var options = kyDatagridData.options;

        // 只有启用了复选框功能该方法才生效
        if (options.enableChecked) {
            row.find(".kyDatagridCheckbox").prop("checked", false);

            // 设置表格的 全选 框为没有选中
            $(target).siblings(".kyDatagrid-header").find("#kyDatagridAllCheckbox").prop("checked", false);
        }

        var idField = options.idField;
        for (var i = 0; i < selectedRows.length; i++) {
            if (selectedRows[i][idField] == rows[index][idField]) {
                // 删除该记录
                selectedRows.splice(i, 1);
            }
        }
        // 更新选中行数据
        $.data(target, 'kyDatagrid', kyDatagridData);

        options.onUnSelect(index, rows[index]);
    }

    // 全选所有行
    function checkAll(target) {
        var rows = $.data(target, "kyDatagrid").rows == undefined ? [] : $.data(target, "kyDatagrid").rows;
        for (var i = 0;
             i < rows.length;
             i++) {
            checkRow(target, i);
        }
    }

    // 取消全选所有行
    function unCheckAll(target) {
        var rows = $.data(target, "kyDatagrid").rows == undefined ? [] : $.data(target, "kyDatagrid").rows;
        for (var i = 0; i < rows.length; i++) {
            unCheckRow(target, i);
        }
    }

    // 返回当前列表选中的第一行，没有则返回null
    function getSelected(target) {
        // 获取全部选中行
        var selectedRows = $(target).siblings(".kyDatagrid-body").find("tr.selected");
        // 选中行数不为 0 时获取第一行的 index 并返回该行数据
        if (selectedRows.length > 0) {
            // 获取全部行数据
            var rows = $.data(target, "kyDatagrid").rows;
            var firstIndex = parseInt($(selectedRows[0]).attr("index"));
            return rows[firstIndex];
        }
        return null;
    }

    // 格式化返回的数据结果，标准格式为{total:100,rows:[]}
    // 只返回数组格式时需要转换成标准格式  []  ->  {rows:[],total:array.length}
    function formatResult(options, data) {
        // 获取分页配置信息
        var pageSize = options.pageSize;
        var pageNo = options.pageNumber;
        var realData = [];
        // 返回类型为数组时，格式化成标准的 JSON 格式
        if (data instanceof Array) {
            if (options.pagination) {
                // 遍历获取真实显示的记录
                for (var i = 0, start = (pageNo - 1) * pageSize; i < pageSize; i++) {
                    // 超过实际数据长度时直接结束遍历
                    if (start + i >= data.length) {
                        break;
                    }
                    realData.push(data[start + i]);
                }
            } else {
                realData = data;
            }
            return {total: data.length, rows: realData};
        }
        // 返回格式为 JSON 时，直接返回
        else if (data instanceof Object) {
            var rows = data.rows;
            if (options.pagination && rows.length > pageSize) {
                // 遍历获取真实显示的记录
                for (var i = 0; i < pageSize; i++) {
                    realData.push(rows[i]);
                }
                data.rows = realData;
            }
            return data;
        }
        // 其他的情况弹窗提示不支持
        else {
            alert("unsupport data type.you should use Array or JSON data to create a table");
        }
    }

    // 输出表头
    function writeTableHead(target) {
        var options = $(target).kyDatagrid('options');
        var length = getMaxDeepLength(options.columns);
        // 获取当前表格的宽度
        var totalWidth = getTotalWidth(getRealColumns(options.columns));
        var queryParams = options.queryParams;
        var rows = new Array(length);
        for (var i = 0; i < length; i++) {
            rows[i] = [];
        }
        // 获取解析后的表头行配置
        rows = resolveHeader(options.columns, rows);
        var thead = $("<thead>");
        // 遍历输出表头行
        for (var i = 0; i < rows.length; i++) {
            var tr = $("<tr>");
            // 第一行需要初始化 行号列单元格 和 全选框单元格
            if (i == 0) {
                // 添加行号列单元格
                if (options.rownumbers) {
                    var rowNumTh = $("<th class='frozenCol'><div class='kyDatagrid-cell'></div></th>");
                    rowNumTh.attr("rowspan", rows.length);
                    tr.append(rowNumTh);
                }
                // 添加全选框单元格
                if (options.enableChecked) {
                    var checkBoxTh = $("<th class='frozenCol'></th>");
                    checkBoxTh.attr("rowspan", rows.length);
                    checkBoxTh.append("<input type='checkbox' id='kyDatagridAllCheckbox'>");
                    tr.append(checkBoxTh);
                }
            }

            // 获取每行配置
            var row = rows[i];
            // 遍历当前行，输出每个单元格
            for (var j = 0; j < row.length; j++) {
                var column = row[j];
                var th = $("<th></th>");
                th.attr("field", column.field);
                var div = $("<div class='kyDatagrid-cell'></div>");
                div.addClass("kyDatagrid-cl-" + column.field);
                div.append("<span>" + column.title + "</span>");
                // 列是否可排序
                if (column.sortable == true) {
                    th.addClass("sortable");
                    div.append("<span class='kyDatagrid-sort-icon'></span>")
                    if (column.field == queryParams.sort && queryParams.order == "desc") {
                        th.addClass("down");
                    }
                    else if (column.field == queryParams.sort && queryParams.order == "asc") {
                        th.addClass("up");
                    }
                }
                // 列是否隐藏
                if (column.hidden == true) {
                    th.css("display", "none");
                }

                if (column.childColumns == undefined || column.childColumns.length <= 0) {
                    th.attr("rowspan", length - i);
                    // 下方没有元素时可以 设置对齐方式
                    var titleAlign = column.titleAlign || column.align;
                    switch (titleAlign) {
                        case 'left':
                            th.css("text-align", "left");
                            break;
                        case 'center':
                            th.css("text-align", "center");
                            break;
                        case 'right':
                            th.css("text-align", "right");
                            break;
                        default:
                            th.css("text-align", "left");
                            break;
                    }
                    // 下方没有元素时可以 设置宽度自适应
                    var columnWidth = column.width == undefined ? 100 : column.width;
                    // th.css("width", parseInt(columnWidth / totalWidth * 100) + "%");
                    // th.css("width", parseInt(columnWidth / totalWidth * 100) + "px");
                }
                else {
                    th.css("text-align", "center");
                    th.attr("colspan", getColspan(column.childColumns));
                }
                th.append(div);
                tr.append(th);
            }

            thead.append(tr);
        }
        return thead[0].outerHTML;
    }

    // 输出表格主体
    function writeTableBody(target, rows) {
        var options = $(target).kyDatagrid('options');
        var columns = getRealColumns(options.columns);
        var tbody = $("<tbody>");
        if (rows.length > 0) {
            // 遍历输出每行数据
            for (var i = 0; i < rows.length; i++) {
                var tr = $("<tr>");
                var row = rows[i];
                tr.attr("id", "kyDatagrid-row-" + i)
                    .attr("index", i)
                    .addClass("kyDatagrid-row")
                // 是否显示行号
                if (options.rownumbers) {
                    var rowNumTd = $("<td>");
                    rowNumTd.html((options.pageNumber - 1 ) * options.pageSize + i + 1);
                    rowNumTd.addClass("frozenCol");
                    tr.append(rowNumTd);
                }
                // 是否显示复选框
                if (options.enableChecked) {
                    var checkboxTd = $("<td>");
                    checkboxTd.html('<input type="checkbox" class="kyDatagridCheckbox"/>');
                    checkboxTd.addClass("frozenCol");
                    tr.append(checkboxTd);
                }
                // 遍历输出每个单元格
                for (var j = 0; j < columns.length; j++) {
                    var td = $("<td>");
                    var column = columns[j];
                    var value = row[column.field] || "";
                    var div = $("<div>");
                    div.addClass("kyDatagrid-cell").addClass("kyDatagrid-cl-" + column.field);
                    // 是否需要格式化输出
                    if (column.formatter) {
                        div.append(column.formatter(value, row, i))
                    }
                    else {
                        div.html(value);
                    }
                    if (column.hidden) {
                        td.css("display", "none");
                    }
                    td.append(div);

                    switch (column.align) {
                        case 'left':
                            td.css("text-align", "left");
                            break;
                        case 'center':
                            td.css("text-align", "center");
                            break;
                        case 'right':
                            td.css("text-align", "right");
                            break;
                        default:
                            td.css("text-align", "left");
                            break;
                    }
                    tr.append(td);
                }
                tbody.append(tr);
            }
            // 输出空行
            if (rows.length < options.pageSize) {
                for (var i = 0; i < options.pageSize - rows.length; i++) {
                    var tr = $("<tr>");
                    // 是否显示行号
                    if (options.rownumbers) {
                        tr.append($("<td>"));
                    }
                    // 是否显示复选框
                    if (options.enableChecked) {
                        tr.append($("<td>"));
                    }
                    for (var j = 0; j < columns.length; j++) {
                        var column = columns[j];
                        if (column.hidden) {
                        } else {
                            tr.append($("<td>"));
                        }
                    }
                    tbody.append(tr);
                }
            }
        }
        else {
            // 输出空行
            var tr = $("<tr>");
            var emptyTd = $("<td>");
            // 获取跨列数量
            var colspan = getColspan(columns);
            // 是否显示行号
            if (options.rownumbers) {
                colspan++;
            }
            // 是否启用复选框
            if (options.enableChecked) {
                colspan++;
            }
            emptyTd.attr("colspan", colspan).css("text-align", "center");

            var div = $("<div>");
            div.addClass("kyDatagrid-cell");
            div.html(options.emptyMsg);
            emptyTd.append(div);
            tr.append(emptyTd);
            tbody.append(tr);
        }

        return tbody[0].outerHTML;
    }

    // 递归获取columns的最深层数
    function getMaxDeepLength(columns, length) {
        length = length || 0;
        // 调用默认增加一层深度，初始从 0 开始
        var maxLength = ++length;

        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            // 有子表头且长度不小于 0 时进行递归
            if (column.childColumns && column.childColumns.length > 0) {
                // 获取该列的深度。
                var theLength = getMaxDeepLength(column.childColumns, length);
                // 判断是否比当前最大深度大
                if (theLength > maxLength) {
                    maxLength = theLength;
                }
            }
        }
        return maxLength;
    }

    // 解析表头，将一层数组转换成多层数组
    function resolveHeader(columns, rows, length) {
        // 初始为 -1 ，因为数组下标从 0 开始，方便使用
        length = length || 0;

        // 调用默认增加一层深度，初始从 -1 开始
        var curLength = ++length;

        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            rows[length - 1].push(column);

            if (column.childColumns && column.childColumns.length > 0) {
                rows = resolveHeader(column.childColumns, rows, curLength);
            }
        }
        return rows;
    }

    // 获取当前表头跨列数量
    function getColspan(columns, length) {
        length = length || 0;
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            // 有子表头时不需要计算当前数量
            if (column.childColumns && column.childColumns.length > 0) {
                length = getColspan(column.childColumns, length);
            }
            // 列不隐藏时宽度+1
            else if (column.hidden == undefined || !column.hidden) {
                length++;
            }
        }

        return length;

    }

    // 计算表格总宽度
    function getTotalWidth(columns) {
        var totalWidth = 0;
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            if (!column.hidden) {
                var width = column.width == undefined ? 100 : column.width;
                totalWidth += width;
            }
        }
        return totalWidth;
    }

    // 获取表格实际显示时的列对象
    function getRealColumns(columns, realColumns) {
        realColumns = realColumns || [];
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            // 有子表头且长度不小于 0 时进行递归
            if (column.childColumns && column.childColumns.length > 0) {
                realColumns = getRealColumns(column.childColumns, realColumns);
            }
            // 没有子表头时表示是最下面一行，直接放入 realColumns
            else {
                realColumns.push(column);
            }
        }
        return realColumns;
    }

    function writeStyleSheet(target, styleSheet) {
        // 创建style样式表
        $("style[kyDatagrid]").remove();

        // style = $("<style type='text/css' kyDatagrid='true'></style>");
        var style = ["<style type='text/css' kyDatagrid='true'>"];


        // 遍历添加样式
        for (var i = 0; i < styleSheet.length; i++) {
            style.push(styleSheet[i]);
        }
        style.push("</style>");
        $(style.join("\n")).appendTo($(target).parents(".kyDatagrid-wrap"));
    }

})(jQuery);
