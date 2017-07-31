/**
 * Kingyea Table (v1.0)
 * 金越自定义表格插件，根据 easyui 的 datagrid 进行设计
 * 通过 artTemplate 模板生成表格,修改 样式/结构 需要修改 tableTemplate.jsp 模板页
 * @author: Mushi(hu_mushi@163.com) 2017年5月16日
 *
 */
(function ($) {

    /**
     * 定义kyTable方法
     * 根据参数类型判断 “初始化表格” 还是 “调用方法“
     */
    $.fn.kyTable = function (options, param) {
        // 类型为 string 表示调用方法
        if (typeof options == 'string') {
            return $.fn.kyTable.methods[options](this, param);
        }

        // 不为 string 时初始化表格
        options = options || {};
        return this.each(function () {
            // jQuery.data( element )
            // jQuery.data( element, key )
            // jQuery.data( element, key, value )
            // 获取当前对象存放的 kyTable 数据值,为undefined表示未初始化,否则表示已经初始化过
            var state = $.data(this, 'kyTable');

            if (state) {  // 不为 undefined 表示初始化过
                // jQuery.extend( target [, object1 ] [, objectN ] )
                // 将两个或更多对象的内容合并到第一个对象。
                $.extend(state.options, options);
            } else {      // 初始化
                options = $.extend({}, $.fn.kyTable.defaults, $.fn.kyTable.parseOptions(this), options);
                // 设置表格配置
                $.data(this, 'kyTable', {options: options});
                reload(this);
            }
        });
    };

    /** 表格默认配置 */
    $.fn.kyTable.defaults = {
        title: undefined,
        url: undefined,
        idField: "id",
        method: 'post',
        queryParams: {},
        enableChecked: false,
        columns: undefined,
        rownumbers: true,                 // 显示行号
        pagination: true,                 // 是否分页
        pageNumber: 1,
        pageSize: 10,
        pageList: [10, 20, 30, 40, 50],
        maxPageLen: 10,
        onLoadSuccess: function (rows) {
        },
        onLoadError: function () {
        },
        onDblClickRow: function (index, row) {
        }
    };

    /** 表格方法路由 */
    $.fn.kyTable.methods = {
        options: function (jq) {
            return $.data(jq[0], 'kyTable').options;
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
            return $.data(jq[0], "kyTable").selectedRows == undefined ? [] : $.data(jq[0], "kyTable").selectedRows;
        }
    };

    /** 格式化表格参数 */
    $.fn.kyTable.parseOptions = function (target) {
        return {};
    };

    // 创建表格
    function createTable(target, rows, options) {
        var emptyRows = [];
        var emptyLen = options.pageSize - rows.length
        while (emptyLen-- > 0) {
            emptyRows.push("");
        }

        var totalWidth = 0;

        // 计算总宽度
        for (var i = 0; i < options.columns.length; i++) {
            var column = options.columns[i];
            if (!column.hidden) {
                var width = column.width == undefined ? 100 : column.width;
                totalWidth += width;
            }
        }
        // 根据模板生成HTML
        var html = template('kyTable', {rows: rows, emptyRows: emptyRows, options: options, totalWidth: totalWidth});
        $(target).html(html);
        $(target).addClass("data-table marb-10 kyTable");
    }

    // 创建分页
    function createPagination(target, totalCount, options) {
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
            begin = pageNo - maxPageLen / 2;
        }
        begin = begin > 0 ? begin : 1;
        // 分页页码数组
        var pageScope = [];
        var len = begin + maxPageLen;
        for (begin;
             begin < len;
             begin++) {
            pageScope.push(begin);
        }

        // 计算启示和结束行号
        var rowBegin = totalCount > 0 ? (pageNo - 1) * pageSize + 1 : 0;
        var rowEnd = pageNo * pageSize > totalCount ? totalCount : pageNo * pageSize;

        // 根据模板生成分页HTML
        var html = template('kyTablePage', {
            totalCount: totalCount,
            pageNo: pageNo,
            pageSize: pageSize,
            totalPage: totalPage,
            pageScope: pageScope,
            rowBegin: rowBegin,
            rowEnd: rowEnd
        });
        $(target).after(html);

        // 绑定翻页事件
        $(target).next('.fenye').find(".page-box li a").on("click", function () {
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
                var options = $(target).kyTable('options');
                options.pageNumber = pageno;
                $.data(target, 'kyTable', {options: options});
                $(target).kyTable('reload');
            }
        })
    }

    // 更新表格
    function reload(target, params) {
        // 获取表格基本配置
        var options = $.data(target, 'kyTable').options;

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
                removeTable(target);
                // 创建表格
                createTable(target, data.rows, options);
                // 根据配置判断是否创建分页
                if (options.pagination) {
                    createPagination(target, data.total, options);
                }
                // 绑定事件
                bindEvent(target);
                // 回调 onloadSuccess 方法
                // 更新表格属性
                var kyTableData = $.data(target, 'kyTable');
                kyTableData.options = options;
                kyTableData.rows = data.rows;
                // 这里清空已经选择过的行记录
                kyTableData.selectedRows = undefined;
                $.data(target, 'kyTable', kyTableData);
                options.onLoadSuccess(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert(XMLHttpRequest.responseText + "   " + textStatus + "  kyTable ajax error");
                options.onLoadError();
            }
        });
    }

    // 移除表格
    function removeTable(target) {
        $(target).html("");
        $(target).next(".fenye").remove();
    }

    // 绑定事件
    function bindEvent(target) {
        var options = $(target).kyTable('options');
        // 绑定表头排序事件
        $(target).find("th.sortable").click(function () {
            var order = "desc";
            var field = $(this).attr("field");
            // 只有当前元素是降序排序时才更新为升序，否则默认为降序排序
            if ($(this).hasClass("down")) {
                order = "asc";
            }
            var queryParam = $.data(target, "kyTable").options.queryParams;
            queryParam.sort = field;
            queryParam.order = order;
            reload(target, queryParam);
        });
        // 绑定行单击事件
        $(target).find(".kyTable-row").click(function () {
            // 表示空行,不进行任何操作
            if ($(this).hasClass("empty-row")) {
                return;
            }
            var rows = $.data(target, "kyTable").rows;
            var index = $(this).attr("index");

            if (!$(this).hasClass("selected")) {
                checkRow(target, index);
            } else {
                unCheckRow(target, index);
            }
        });
        // 绑定行双击事件
        $(target).find(".kyTable-row").dblclick(function () {
            var rows = $.data(target, "kyTable").rows;
            var index = $(this).attr("index");
            $.data(target, "kyTable").options.onDblClickRow(index, rows[index]);
        })
        // 绑定 全选/取消全选 事件
        if (options.enableChecked) {
            $(target).find("#kyTableAllCheckbox").on("click", function () {
                if (!$(this).prop("checked")) {
                    unCheckAll(target);
                } else {
                    checkAll(target);
                }
            });
        }
    }

    // 选中指定行
    function checkRow(target, index) {
        // 首先更新选中状态
        var row = $(target).find("#kyTable-row-" + index);
        // 表示已经选中，不做任何操作
        if (row.hasClass("selected")) {
            return;
        }
        row.addClass("selected");

        var kyTableData = $.data(target, 'kyTable');
        var rows = kyTableData.rows == undefined ? [] : kyTableData.rows;
        var selectedRows = kyTableData.selectedRows == undefined ? [] : kyTableData.selectedRows;
        var options = kyTableData.options;

        // 只有启用了复选框功能该方法才生效
        if (options.enableChecked) {
            row.find(".kyTableCheckbox").prop("checked", true);

            var idField = options.idField;
            var isExist = false;
            for (var i = 0; i < selectedRows.length; i++) {
                if (selectedRows[i][idField] == rows[index][idField]) {
                    isExist = true;
                }
            }
            if (!isExist) {
                selectedRows.push(rows[index]);
                kyTableData.selectedRows = selectedRows;
            }
            // 更新选中行数据
            $.data(target, 'kyTable', kyTableData);
        }

        // 全选时设置表格的 全选 框为选中
        var isAllChecked = true;
        for (var i = 0; i < rows.length; i++) {
            if (!$("#kyTable-row-" + i).find(".kyTableCheckbox").prop("checked")) {
                isAllChecked = false;
            }
        }
        if (isAllChecked) {
            $(target).find("#kyTableAllCheckbox").prop("checked", true);
        }
    }

    // 取消选中指定行
    function unCheckRow(target, index) {
        // 首先更新选中状态
        var row = $(target).find("#kyTable-row-" + index);
        // 表示没有被选中，不做任何操作
        if (!row.hasClass("selected")) {
            return;
        }
        row.removeClass("selected");

        var kyTableData = $.data(target, 'kyTable');
        var rows = kyTableData.rows == undefined ? [] : kyTableData.rows;
        var selectedRows = kyTableData.selectedRows == undefined ? [] : kyTableData.selectedRows;
        var options = kyTableData.options;

        // 只有启用了复选框功能该方法才生效
        if (options.enableChecked) {
            row.find(".kyTableCheckbox").prop("checked", false);

            var idField = options.idField;
            for (var i = 0;
                 i < selectedRows.length;
                 i++) {
                if (selectedRows[i][idField] == rows[index][idField]) {
                    // 删除该记录
                    selectedRows.splice(i, 1);
                }
            }
            // 更新选中行数据
            $.data(target, 'kyTable', kyTableData);
        }
        // 设置表格的 全选 框为没有选中
        $(target).find("#kyTableAllCheckbox").prop("checked", false);
    }

    // 全选所有行
    function checkAll(target) {
        var rows = $.data(target, "kyTable").rows == undefined ? [] : $.data(target, "kyTable").rows;
        for (var i = 0;
             i < rows.length;
             i++) {
            checkRow(target, i);
        }
    }

    // 取消全选所有行
    function unCheckAll(target) {
        var rows = $.data(target, "kyTable").rows == undefined ? [] : $.data(target, "kyTable").rows;
        for (var i = 0;
             i < rows.length;
             i++) {
            unCheckRow(target, i);
        }
    }

    // 返回当前列表选中的第一行，没有则返回null
    function getSelected(target) {
        // 获取全部选中行
        var selectedRows = $(target).find("tr.selected");
        // 选中行数不为 0 时获取第一行的 index 并返回该行数据
        if (selectedRows.length > 0) {
            // 获取全部行数据
            var rows = $.data(target, "kyTable").rows;
            var firstIndex = parseInt($(selectedRows[0]).attr("index"));
            return rows[firstIndex];
        }
        return null;
    }

})(jQuery);
