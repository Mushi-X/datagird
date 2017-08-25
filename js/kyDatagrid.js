/**
 * Kingyea Datagrid (v3.0)
 * 金越自定义表格插件，根据 easyui 的 datagrid 进行设计
 * 实现以下功能
 *  - 左侧固定列
 *  - 隐藏和显示指定列
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

                if (options.columns == undefined) {
                    options.columns = parseColumnOpt(this);
                }
                // 设置表格配置
                $.data(this, 'kyDatagrid', {options: options, data: {total: 0, rows: []}});
                init(this);
                reload(this);
            }
        });
    };

    /** 表格默认配置 */
    $.fn.kyDatagrid.defaults = {
        title: undefined,
        url: undefined,
        height: undefined,
        idField: "id",
        method: 'post',
        queryParams: {},
        fit: false,
        enableChecked: false,
        frozenColumns: [],
        columns: [],
        rownumbers: true,                 // 显示行号
        pagination: true,                 // 是否分页
        pageNumber: 1,
        singleSelect: true,
        pageSize: 10,
        scrollBarWidth: 18,
        pageList: [10, 20, 30, 40, 50],
        minColWidth: 100,
        emptyMsg: '记录为空!',
        trAttr: function (tr, row, index) {
        },
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
        },
        changePage: function (jq, pageNo) {
            return jq.each(function () {
                changePage(this, pageNo);
            })
        },
        hideColumn: function (jq, field) {
            return jq.each(function () {
                hideColumn(this, field);
            })
        },
        showColumn: function (jq, field) {
            return jq.each(function () {
                showColumn(this, field);
            })
        }
    };

    /** 格式化表格参数 */
    $.fn.kyDatagrid.parseOptions = function (target) {
        return {};
    };

    // 解析html中table的列属性配置
    function parseColumnOpt(target) {
        var t = $(target);
        // 表格中一行数据都没有时，直接返回空数组
        if (t.find("tr").length == 0) {
            return [];
        }
        var columns = [];
        // 有thead才可以实现复杂表头
        // TODO 解析已有表格的复杂表头
        if (t.find("thead").length > 0) {
            var trs = t.find("thead tr");
            for (var i = 0; i < trs.length; i++) {
                var tr = trs[i];
                var ths = $(tr).find("th");
                for (var j = 0; j < ths.length; j++) {
                    var th = ths[j];
                    column = {};
                    column.title = $(th).html();
                    column.field = $(th).attr("field");
                    column.sortable = $(th).attr("sortable") == "true";
                    columns.push(column);
                }
            }
            return columns;
        }
        // 没有 thead 的时候直接获取表格第一行当做表头
        else {
            var tr = t.find("tr")[0];
            var ths = $(tr).find("th");
            for (var i = 0; i < ths.length; i++) {
                var th = ths[i];
                var column = {};
                column.title = $(th).html();
                column.field = $(th).attr("field");
                column.sortable = $(th).attr("sortable") == "true";
                columns.push(column);
            }
            return columns;
        }
    }

    // 初始化表格结构
    function init(target) {
        var options = $(target).kyDatagrid('options');

        $(target).css("display", "none");
        // 创建包裹结构
        $(target).wrap($("<div class='kyDatagrid-wrap'></div>")).wrap($("<div class='kyDatagrid-view'></div>"));

        // 获取外层各对象
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        var kyDatagridView = kyDatagridWrap.find(".kyDatagrid-view");
        kyDatagridView.append("<div class='kyDatagrid-view1'>").append("<div class='kyDatagrid-view2'>");
        var kyDatagridView1 = kyDatagridWrap.find(".kyDatagrid-view1");
        var kyDatagridView2 = kyDatagridWrap.find(".kyDatagrid-view2");
        // 左侧固定列初始化
        kyDatagridView1.append("<div class='kyDatagrid-head'>").append("<div class='kyDatagrid-body'>");
        kyDatagridView1.find(".kyDatagrid-head").append("<table class='data-table'>");
        kyDatagridView1.find(".kyDatagrid-body").append("<table class='data-table'>");
        kyDatagridView1.find(".kyDatagrid-head table").append(writeTableHead(target, options.frozenColumns, true));
        // 右侧表格主体列初始化
        kyDatagridView2.append("<div class='kyDatagrid-head'>").append("<div class='kyDatagrid-body'>");
        kyDatagridView2.find(".kyDatagrid-head").append("<table class='data-table'>");
        kyDatagridView2.find(".kyDatagrid-head table").append(writeTableHead(target, options.columns));
        kyDatagridView2.find(".kyDatagrid-body").append("<table class='data-table'>");

        $.data(target, "kyDatagrid").headTable = kyDatagridView2.find(".kyDatagrid-head table");
        $.data(target, "kyDatagrid").bodyTable = kyDatagridView2.find(".kyDatagrid-body table");


        kyDatagridView.contextmenu(function (e) {
            // 获取当前点击元素
            var targetElement = e.target;
            console.log(targetElement);
        });
    }

    // 加载数据
    function loadData(target, data) {
        var options = $(target).kyDatagrid('options');
        var data = formatResult(options, data);
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        kyDatagridWrap.find(".kyDatagrid-view1 .kyDatagrid-body table").empty().append(writeTableBody(target, data.rows, true));
        kyDatagridWrap.find(".kyDatagrid-view2 .kyDatagrid-body table").empty().append(writeTableBody(target, data.rows));

        // 更新表格配置
        var kyDatagridData = $.data(target, 'kyDatagrid');
        kyDatagridData.options = options;
        kyDatagridData.data = data;
        $.data(target, 'kyDatagrid', kyDatagridData);
        // 是否显示分页
        if (options.pagination) {
            writePagination(target);
        }
        // 绑定事件
        bindEvent(target);
        // 设置表格高度
        setTableHeight(target);
        // 设置列宽
        setColWidth(target);
        return data;
    }

    // 绑定事件
    function bindEvent(target) {
        var options = $(target).kyDatagrid('options');
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        // 绑定表头排序事件
        kyDatagridWrap.find("th.sortable").unbind("click").click(function (event) {
            var order = "desc";
            var field = $(this).attr("field");
            // 只有当前元素是降序排序时才更新为升序，否则默认为降序排序
            if ($(this).hasClass("down")) {
                order = "asc";
            }
            kyDatagridWrap.find("th.sortable").removeClass("down").removeClass("up");
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

        // 绑定同步滚动事件
        kyDatagridWrap.find(".kyDatagrid-view2 .kyDatagrid-body").scroll(function (e) {
            var scrollHeight = $(this).scrollTop();
            kyDatagridWrap.find(".kyDatagrid-view1 .kyDatagrid-body").scrollTop(scrollHeight);
        });

        // 绑定hover事件
        kyDatagridWrap.find(".kyDatagrid-row").hover(
            function () {
                var index = $(this).attr("index");
                $(target).parents(".kyDatagrid-wrap").find("tr#kyDatagrid-row-" + index).addClass("hover");
            }, function () {
                var index = $(this).attr("index");
                $(target).parents(".kyDatagrid-wrap").find("tr#kyDatagrid-row-" + index).removeClass("hover");
            }
        );

        // 绑定行单击事件
        kyDatagridWrap.find(".kyDatagrid-row").unbind("click").click(function (event) {
            // 表示空行,不进行任何操作
            if ($(this).hasClass("empty-row")) {
                return;
            }
            var rows = $.data(target, "kyDatagrid").data.rows;
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
        kyDatagridWrap.find(".kyDatagrid-row").unbind("dblclick").dblclick(function (event) {
            var rows = $.data(target, "kyDatagrid").data.rows;
            var index = $(this).attr("index");
            $.data(target, "kyDatagrid").options.onDblClickRow(index, rows[index]);
        });

        // 绑定 全选/取消全选 事件
        if (options.enableChecked) {
            kyDatagridWrap.find("#kyDatagridAllCheckbox").unbind("click").click(function () {
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

    // 输出分页
    function writePagination(target) {
        var options = $(target).kyDatagrid('options');
        $(target).parents(".kyDatagrid-wrap").find(".pagination").remove();
        // 初始化，防止undefined
        var totalCount = $.data(target, 'kyDatagrid').data.total;
        var kyDatagridPanel = $(target).parents(".kyDatagrid-wrap");
        // 获取分页相关参数
        totalCount = parseInt(totalCount);               // 总记录数
        var pageNo = parseInt(options.pageNumber);       // 当前页数
        var pageSize = parseInt(options.pageSize);       // 每页大小

        // 计算总页数
        var totalPage = (totalCount % pageSize == 0) ? totalCount / pageSize : (parseInt(totalCount / pageSize) + 1);
        totalPage = totalPage == 0 ? 1 : totalPage;
        // 计算起始和结束行号
        var rowBegin = totalCount > 0 ? (pageNo - 1) * pageSize + 1 : 0;
        var rowEnd = pageNo * pageSize > totalCount ? totalCount : pageNo * pageSize;

        var pagination = $("<div class='pagination '></div>")
        var pageBox = $('<div class="page-box">' +
            '<div class="left show-g">' +
            '<ul>' +
            '<li><select class="pagination-page-list"></select></li>' +
            '<li><a href="javascript:void(0)" class="pagination-first"></a><a href="javascript:void(0)" class="pagination-prev"></a></li>' +
            '<li>第<input type="text" class="pagination-num" name="pagination-num"> 共<span class="pagination-total-page"></span>页 </li>' +
            '<li> <a href="javascript:void(0)" class="pagination-next"></a><a href="javascript:void(0)" class="pagination-last"></a></li>' +
            '<li> <a href="javascript:void(0)" class="pagination-load"></a></li>' +
            '</ul>' +
            '</div>' +
            '<div class="pagination-info">显示第0到0条，共0条</div>' +
            '</div>');

        // region // 每页记录数控制
        var pageList = pageBox.find("select.pagination-page-list");
        for (var i = 0; i < options.pageList.length; i++) {
            var option = $("<option>");
            option.html(options.pageList[i]);
            option.val(options.pageList[i]);

            if (options.pageSize == options.pageList[i]) {
                option.prop("selected", true);
            }
            option.appendTo(pageList);
        }

        pageList.on("change", function (event) {
            var pageSize = $(this).val();
            options.pageSize = pageSize;
            $.data(target, 'kyDatagrid').options = options;
            changePage(target, 1);
        });

        pagination.append(pageBox);
        // endregion

        pageBox.find("input.pagination-num").val(pageNo);
        // 修改页码后按回车跳页
        pagination.on("keyup", "input.pagination-num", function (event) {
            // 按下回车时跳转页面
            if (event.which == 13) {
                var curPageNum = $(this).val();
                changePage(target, curPageNum);
            }
        });
        // 更新记录信息
        pagination.find(".pagination-total-page").html(totalPage);
        pagination.find(".pagination-info").html("显示第" + rowBegin + "到" + rowEnd + "条，共" + totalCount + "条");

        $(kyDatagridPanel).append(pagination);

        // 绑定翻页事件
        pagination.find(".pagination-first").on("click", function () {
            changePage(target, 1);
        });
        pagination.find(".pagination-prev").on("click", function () {
            changePage(target, pageNo - 1);
        });
        pagination.find(".pagination-next").on("click", function () {
            changePage(target, pageNo + 1);
        });
        pagination.find(".pagination-last").on("click", function () {
            changePage(target, totalPage);
        });
        pagination.find(".pagination-load").on("click", function () {
            reload(target);
        });
    }

    // 跳转到制定页
    function changePage(target, pageNo) {
        var options = $(target).kyDatagrid('options');

        var state = $.data(target, 'kyDatagrid');

        var totalPage = (state.data.total % options.pageSize == 0) ? state.data.total / options.pageSize : (parseInt(state.data.total / options.pageSize) + 1);
        // 是否为正整数
        if ((/^(\+|-)?\d+$/.test(pageNo)) && pageNo > 0) {
            // 超过总页数时，跳转到尾页
            if (pageNo > totalPage) {
                pageNo = totalPage;
            }
        }
        // 不为正整数时跳转到第一页
        else {
            pageNo = 1;
        }

        options.pageNumber = pageNo;
        reload(target);
    }

    // 更新表格
    function reload(target, params) {
        // 获取表格基本配置
        var options = $(target).kyDatagrid("options");

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
        var rows = [];
        // 配置中的 url 不为 undefined 时进行异步请求
        if (options.url != undefined) {
            // ajax加载数据
            // 返回结果 json 格式为 {total:0,rows:[]}
            // 其中 total 为总记录数 ， rows 为列表数组数据,里面每行json表示一行数据
            $.ajax({
                url: options.url,
                type: options.method,
                data: queryParams,
                dataType: 'json',
                success: function (data) {
                    data = loadData(target, data);
                    // 回调 onloadSuccess 方法
                    options.onLoadSuccess(data.rows);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    loadData(target, []);
                    // 回调 onLoadError 方法
                    options.onLoadError();
                }
            });
        }
        // options 中 url 为空时加载本地数据
        else {
            var data = options.data || [];
            data = loadData(target, data);
            // 回调 onloadSuccess 方法
            options.onLoadSuccess(data.rows);
        }

    }

    // 移除表格
    function removeTable(target) {
        $(target).siblings().remove();
        $(target).unwrap().siblings().remove();
        $(target).unwrap();
    }

    // 设置表格高度自适应
    function setTableHeight(target) {
        var options = $(target).kyDatagrid('options');
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        // 是否启用 fit 适应屏幕高度
        if (options.height || options.fit) {
            // 获取屏幕高度，减去部分像素表示在屏幕下方留白，不会刚好到底部
            var screenHeight = $(window).height() - 10;
            var offsetTop = $(target).parents('.kyDatagrid-wrap').offset().top;

            // 表格头部高度
            var headHeight = 35 * getMaxDeepLength(options.columns);
            // 分页高度
            var paginationHeight = $(".pagination").height();

            // 包裹层高度
            var wrapHeight = options.height || screenHeight - offsetTop
            wrapHeight = wrapHeight < (headHeight + paginationHeight) ? headHeight + paginationHeight : wrapHeight;
            // 表格视图层高度
            var viewHeight = wrapHeight;

            // 是否分页，分页需要减去分页层的高度
            if (options.pagination) {
                viewHeight -= 31;
            }
            // 设置各容器层高度
            kyDatagridWrap.css('height', wrapHeight);
            kyDatagridWrap.find('.kyDatagrid-view').css('height', viewHeight + options.scrollBarWidth);
            kyDatagridWrap.find('.kyDatagrid-view1').css('height', viewHeight + options.scrollBarWidth);
            kyDatagridWrap.find('.kyDatagrid-view2').css('height', viewHeight + options.scrollBarWidth);
            kyDatagridWrap.find(".kyDatagrid-head").css("height", headHeight);
            kyDatagridWrap.find('.kyDatagrid-body').css('height', viewHeight - headHeight);
        }
    }

    // 设置列宽自适应
    function setColWidth(target) {
        var options = $(target).kyDatagrid('options');
        // 列宽度样式表
        var styleSheet = [];

        // 获取页面最大宽度。
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        var maxWidth = kyDatagridWrap.width();
        maxWidth = kyDatagridWrap.parent().width();
        kyDatagridWrap.css("width", maxWidth);


        // region // 左侧固定列宽度设置
        // 获取左侧固定列
        var frozenColumns = getVisibleColumns(getRealColumns(options.frozenColumns));
        var frozenColTotalWidth = getTotalWidth(frozenColumns);
        var leftViewWidth = 100 * frozenColumns.length;

        // 遍历设置每列宽度
        for (var i = 0; i < frozenColumns.length; i++) {
            var column = frozenColumns[i];
            if (column.hidden == undefined || !column.hidden) {
                var columnWidth = column.width == undefined ? 100 : column.width;
                var columnKey = ".kyDatagrid-cl-" + column.field;
                var width = parseInt(columnWidth / frozenColTotalWidth * leftViewWidth) - 12;
                styleSheet.push("" + columnKey + " {width:" + width + "px}");
            }
        }
        // TODO 这里36是每列宽度。后期需要修改。左侧做成frozenCol
        if (options.rownumbers) {
            leftViewWidth += 36;
        }
        if (options.enableChecked) {
            leftViewWidth += 36;
        }

        // 设置左侧固定列部分容器和表格的宽度
        kyDatagridWrap.find(".kyDatagrid-view1").css("width", leftViewWidth);
        kyDatagridWrap.find(".kyDatagrid-view1 .kyDatagrid-head").css("width", leftViewWidth);
        kyDatagridWrap.find(".kyDatagrid-view1 .kyDatagrid-body").css("width", leftViewWidth);
        kyDatagridWrap.find(".kyDatagrid-view1 .kyDatagrid-head table").css("width", leftViewWidth);
        kyDatagridWrap.find(".kyDatagrid-view1 .kyDatagrid-body table").css("width", leftViewWidth);

        // endregion

        // region // 右侧表格主体部分宽度设置
        // 获取右侧表格列
        var realColumns = getVisibleColumns(getRealColumns(options.columns));
        var totalWidth = getTotalWidth(realColumns);
        var rightViewWidth = maxWidth - leftViewWidth;
        // 右侧表格的宽度，每列最少有100像素的宽度
        var tempTableWidth = realColumns.length * 100;
        var rightTableWidth = rightViewWidth > tempTableWidth ? rightViewWidth : tempTableWidth;
        rightTableWidth = rightTableWidth - options.scrollBarWidth;
        // 设置右侧表格主体部分容器和表格的宽度
        kyDatagridWrap.find(".kyDatagrid-view2").css("width", rightViewWidth);
        kyDatagridWrap.find(".kyDatagrid-view2 .kyDatagrid-head").css("width", rightTableWidth + options.scrollBarWidth);
        kyDatagridWrap.find(".kyDatagrid-view2 .kyDatagrid-body").css("width", rightTableWidth + options.scrollBarWidth);
        kyDatagridWrap.find(".kyDatagrid-view2 .kyDatagrid-head table").css("width", rightTableWidth);
        kyDatagridWrap.find(".kyDatagrid-view2 .kyDatagrid-body table").css("width", rightTableWidth);

        // 遍历设置每列宽度
        for (var i = 0; i < realColumns.length; i++) {
            var column = realColumns[i];
            if (column.hidden == undefined || !column.hidden) {
                var columnWidth = column.width == undefined ? 100 : column.width;
                var columnKey = ".kyDatagrid-cl-" + column.field;
                // 只向下取整，防止表格宽度超过view的宽度出现下方滚动条
                var width = Math.floor(columnWidth / totalWidth * rightTableWidth) - 13;
                styleSheet.push("" + columnKey + " {width:" + width + "px}");
            }
        }
        // endregion

        // 写出样式表到页面
        writeStyleSheet(target, styleSheet);
    }

    // 判断行是否被选中
    function isChecked(target, index) {
        var row = $(target).parents(".kyDatagrid-wrap").find("#kyDatagrid-row-" + index);
        // 表示已经选中，不做任何操作
        if (row.hasClass("selected")) {
            return true;
        }
        return false;
    }

    // 选中指定行
    function checkRow(target, index) {
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        // region // 更新选中状态
        var row = kyDatagridWrap.find("tr#kyDatagrid-row-" + index);
        // 表示已经选中，不做任何操作
        if (row.hasClass("selected")) {
            return;
        }
        row.addClass("selected");

        var kyDatagridData = $.data(target, 'kyDatagrid');
        var rows = kyDatagridData.data.rows || [];
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
            kyDatagridWrap.find("#kyDatagridAllCheckbox").prop("checked", true);
            options.onSelectAll(rows);
        }
        // endregion
        options.onSelect(index, rows[index]);
    }

    // 取消选中指定行
    function unCheckRow(target, index) {
        var kyDatagridWrap = $(target).parents(".kyDatagrid-wrap");
        // 首先更新选中状态
        var row = kyDatagridWrap.find("tr#kyDatagrid-row-" + index);
        // 表示没有被选中，不做任何操作
        if (!row.hasClass("selected")) {
            return;
        }
        row.removeClass("selected");

        var kyDatagridData = $.data(target, 'kyDatagrid');
        var rows = kyDatagridData.data.rows == undefined ? [] : kyDatagridData.data.rows;
        var selectedRows = kyDatagridData.selectedRows == undefined ? [] : kyDatagridData.selectedRows;
        var options = kyDatagridData.options;

        // 只有启用了复选框功能该方法才生效
        if (options.enableChecked) {
            row.find(".kyDatagridCheckbox").prop("checked", false);

            // 设置表格的 全选 框为没有选中
            kyDatagridWrap.find("#kyDatagridAllCheckbox").prop("checked", false);
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
        var rows = $.data(target, "kyDatagrid").data.rows == undefined ? [] : $.data(target, "kyDatagrid").data.rows;
        // 遍历选中所有行
        for (var i = 0; i < rows.length; i++) {
            checkRow(target, i);
        }
    }

    // 取消全选所有行
    function unCheckAll(target) {
        var rows = $.data(target, "kyDatagrid").data.rows == undefined ? [] : $.data(target, "kyDatagrid").data.rows;
        for (var i = 0; i < rows.length; i++) {
            unCheckRow(target, i);
        }
    }

    // 返回当前列表选中的第一行，没有则返回null
    function getSelected(target) {
        // 获取全部选中行
        var selectedRows = $(target).parents(".kyDatagrid-wrap").find("tr.selected");
        // 选中行数不为 0 时获取第一行的 index 并返回该行数据
        if (selectedRows.length > 0) {
            // 获取全部行数据
            var rows = $.data(target, "kyDatagrid").data.rows;
            var firstIndex = parseInt($(selectedRows[0]).attr("index"));
            return rows[firstIndex];
        }
        return null;
    }

    // 格式化返回的数据结果，标准格式为{total:100,rows:[]}
    function formatResult(options, data) {
        // 只返回数组格式时需要转换成标准格式  []  ->  {rows:[],total:array.length}
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
            return data;
        }
        // 其他的情况弹窗提示不支持
        else {
            alert("unsupport data type.you should use Array or JSON data to create a table");
        }
    }

    // 输出表头
    function writeTableHead(target, columns, isFrozenCol) {
        var options = $(target).kyDatagrid('options');
        var length = getMaxDeepLength(columns);
        var mainColLength = getMaxDeepLength(options.columns);
        var frozenColLength = getMaxDeepLength(options.frozenColumns);
        var maxLength = mainColLength > frozenColLength ? mainColLength : frozenColLength;
        // 获取当前表格的宽度
        var totalWidth = getTotalWidth(getRealColumns(columns));
        var queryParams = options.queryParams;
        var rows = new Array(length);
        for (var i = 0; i < length; i++) {
            rows[i] = [];
        }
        // 获取解析后的表头行配置
        rows = resolveHeader(columns, rows);
        var thead = $("<thead>");
        // 遍历输出表头行
        for (var i = 0; i < rows.length; i++) {
            var tr = $("<tr>");
            // 第一行需要初始化 行号列单元格 和 全选框单元格
            if (i == 0) {
                // 添加行号列单元格
                if (isFrozenCol && options.rownumbers) {
                    var rowNumTh = $("<th class='frozenCol rownumber'><div class='kyDatagrid-cell'></div></th>");
                    rowNumTh.attr("rowspan", rows.length);
                    rowNumTh.css("height", (maxLength - i) * 35);
                    tr.append(rowNumTh);
                }
                // 添加全选框单元格
                if (isFrozenCol && options.enableChecked) {
                    var checkBoxTh = $("<th class='frozenCol'></th>");
                    checkBoxTh.attr("rowspan", rows.length);
                    checkBoxTh.css("height", (maxLength - i) * 35);
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
                    div.append("<span class='right kyDatagrid-dropdown-menu'></span>")
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
                // 下方没有元素时,设置 rowspan 以及对齐方式
                if (column.childColumns == undefined || getColspan(column.childColumns) <= 0) {
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
                    // 下方没有元素时可以 设置高度
                    th.css("height", (maxLength - i) * 35);
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
    function writeTableBody(target, rows, isFrozenCol) {
        var options = $(target).kyDatagrid('options');
        var columns;
        if (!isFrozenCol) {
            columns = getRealColumns(options.columns);
        } else {
            columns = getRealColumns(options.frozenColumns);
        }
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
                if (isFrozenCol && options.rownumbers) {
                    var rowNumTd = $("<td class='frozenCol rownumber'>");
                    rowNumTd.html((options.pageNumber - 1 ) * options.pageSize + i + 1);
                    tr.append(rowNumTd);
                }
                // 是否显示复选框
                if (isFrozenCol && options.enableChecked) {
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
                    td.attr("field", column.field);
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
                    }
                    tr.append(td);
                }

                options.trAttr(tr, row, i);
                tbody.append(tr);
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

    // 输出样式表，更新单元格宽度
    function writeStyleSheet(target, styleSheet) {
        // 创建style样式表
        $(target).parents(".kyDatagrid-wrap").find(".kyDatagrid-view style[kyDatagrid]").remove();

        var style = ["<style type='text/css' kyDatagrid='true'>"];

        // 遍历添加样式
        for (var i = 0; i < styleSheet.length; i++) {
            style.push(styleSheet[i]);
        }
        style.push("</style>");
        $(style.join("\n")).appendTo($(target).parents(".kyDatagrid-wrap .kyDatagrid-view"));
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
            if (column.childColumns && getColspan(column.childColumns, length) > 0) {
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
            if (column.childColumns && getColspan(column.childColumns) > 0) {
                realColumns = getRealColumns(column.childColumns, realColumns);
            }
            // 没有子表头时表示是最下面一行，直接放入 realColumns
            else {
                realColumns.push(column);
            }
        }
        return realColumns;
    }

    // 获取可见的列
    function getVisibleColumns(columns) {
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i]
            if (column.hidden) {
                columns.splice(i, 1);
            }
        }
        return columns;
    }

    // 隐藏指定列
    function hideColumn(target, field) {
        var state = $.data(target, 'kyDatagrid');
        var options = state.options;
        var columns = options.columns;
        columns = updateColumnProp(columns, field, "hidden", true);
        var headTable = state.headTable;
        $(headTable).empty().append(writeTableHead(target));
        reload(target);
    }

    // 显示指定列
    function showColumn(target, field) {
        var state = $.data(target, 'kyDatagrid');
        var options = state.options;
        var columns = options.columns;
        columns = updateColumnProp(columns, field, "hidden", false);
        var headTable = state.headTable;
        $(headTable).empty().append(writeTableHead(target));
        reload(target);
    }

    // 更新列配置中指定列的某个属性
    function updateColumnProp(columns, field, attr, value) {
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            if (field == column.field) {
                column[attr] = value;
            } else if (column.childColumns != undefined && column.childColumns.length > 0) {
                column.childColumns = updateColumnProp(column.childColumns, field, attr, value);
            }
        }
        return columns;
    }

})(jQuery);
