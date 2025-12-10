frappe.pages['pos-screen'].on_page_load = function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __('POS'),
		single_column: false
	});

	new ModernPOS(wrapper);
};

class ModernPOS {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.page = wrapper.page;
		
		// Initialize data
		this.cart = [];
		this.selected_customer = null;
		this.pos_profile = null;
		this.items = [];
		this.customers = [];
		this.payment_methods = [];
		this.barcode_buffer = '';
		this.barcode_timeout = null;
		
		this.init();
	}

	init() {
		// Setup page
		this.setup_page_actions();
		this.setup_layout();
		this.setup_barcode_listener();
		
		// Load data
		this.load_pos_data();
	}

	setup_page_actions() {
		// New Sale button
		this.page.set_primary_action(__('New Sale'), () => {
			this.clear_cart();
		}, 'octicon octicon-plus');

		// Hold Sale
		this.page.add_action_icon('octicon octicon-archive', () => {
			this.hold_sale();
		}, __('Hold Sale'));

		// Settings
		this.page.add_action_icon('octicon octicon-gear', () => {
			this.show_settings();
		}, __('Settings'));

		// Close POS
		this.page.add_action_icon('octicon octicon-x', () => {
			this.close_pos();
		}, __('Close'));
	}

	setup_layout() {
		// Make page full width and remove padding
		this.page.wrapper.find('.layout-main-section-wrapper').css({
			'padding': '0',
			'max-width': 'none'
		});

		this.page.main.html(`
			<div class="modern-pos" style="display: flex; height: calc(100vh - 60px); background: #f5f5f5;">
				<!-- Left Panel: Products -->
				<div class="pos-left-panel" style="flex: 1; display: flex; flex-direction: column; background: white; border-right: 1px solid #e0e0e0;">
					<!-- Search and Filters -->
					<div class="pos-search-section" style="padding: 15px; border-bottom: 1px solid #e0e0e0; background: #fafafa;">
						<div style="display: flex; gap: 10px; margin-bottom: 10px;">
							<input type="text" id="pos-search" class="form-control" placeholder="${__('Search items or scan barcode...')}" style="flex: 1;">
							<button class="btn btn-default" id="clear-search">
								<i class="fa fa-times"></i>
							</button>
						</div>
						<div id="pos-categories" style="display: flex; gap: 8px; flex-wrap: wrap; overflow-x: auto;">
							<!-- Categories will be loaded here -->
						</div>
					</div>

					<!-- Products Grid -->
					<div class="pos-products-grid" style="flex: 1; overflow-y: auto; padding: 15px;">
						<div id="products-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
							<!-- Products will be loaded here -->
						</div>
					</div>
				</div>

				<!-- Right Panel: Cart & Checkout -->
				<div class="pos-right-panel" style="width: 450px; display: flex; flex-direction: column; background: white;">
					<!-- Customer Section -->
					<div class="pos-customer-section" style="padding: 15px; border-bottom: 1px solid #e0e0e0; background: #fafafa;">
						<label style="font-weight: 600; margin-bottom: 8px; display: block;">${__('Customer')}</label>
						<div style="display: flex; gap: 10px;">
							<select id="customer-select" class="form-control" style="flex: 1;">
								<option value="">${__('Walk-in Customer')}</option>
							</select>
							<button class="btn btn-default" id="new-customer-btn" title="${__('New Customer')}">
								<i class="fa fa-plus"></i>
							</button>
						</div>
					</div>

					<!-- Cart Items -->
					<div class="pos-cart-section" style="flex: 1; overflow-y: auto; border-bottom: 1px solid #e0e0e0;">
						<div id="cart-items">
							<div class="text-center" style="padding: 60px 20px; color: #999;">
								<i class="fa fa-shopping-cart" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i>
								<p>${__('Cart is empty')}</p>
								<small>${__('Scan or click items to add')}</small>
							</div>
						</div>
					</div>

					<!-- Totals -->
					<div class="pos-totals-section" style="padding: 15px; border-bottom: 2px solid #e0e0e0; background: #fafafa;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
							<span>${__('Subtotal:')}</span>
							<strong id="cart-subtotal">₹0.00</strong>
						</div>
						<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
							<span>${__('Discount:')}</span>
							<span id="cart-discount" style="color: #4caf50;">₹0.00</span>
						</div>
						<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
							<span>${__('Tax:')}</span>
							<span id="cart-tax">₹0.00</span>
						</div>
						<div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
							<strong style="font-size: 18px;">${__('Total:')}</strong>
							<strong id="cart-total" style="font-size: 24px; color: #2196f3;">₹0.00</strong>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="pos-actions-section" style="padding: 15px; display: flex; gap: 10px;">
						<button class="btn btn-default" id="discount-btn" style="flex: 1;">
							<i class="fa fa-percent"></i> ${__('Discount')}
						</button>
						<button class="btn btn-success" id="pay-btn" style="flex: 2; font-size: 16px; font-weight: 600;">
							<i class="fa fa-check"></i> ${__('Pay')}
						</button>
					</div>
				</div>
			</div>
		`);

		this.setup_event_handlers();
	}

	setup_event_handlers() {
		const $main = this.page.main;

		// Search
		$main.find('#pos-search').on('input', (e) => {
			this.filter_products($(e.target).val());
		});

		$main.find('#clear-search').on('click', () => {
			$main.find('#pos-search').val('').trigger('input');
		});

		// Customer
		$main.find('#customer-select').on('change', (e) => {
			this.select_customer($(e.target).val());
		});

		$main.find('#new-customer-btn').on('click', () => {
			this.show_new_customer_dialog();
		});

		// Actions
		$main.find('#discount-btn').on('click', () => {
			this.apply_discount();
		});

		$main.find('#pay-btn').on('click', () => {
			this.show_payment_dialog();
		});

		// Keyboard shortcuts
		$(document).on('keydown', (e) => {
			// F2 - Focus search
			if (e.key === 'F2') {
				e.preventDefault();
				$main.find('#pos-search').focus();
			}
			// F9 - Payment
			else if (e.key === 'F9') {
				e.preventDefault();
				this.show_payment_dialog();
			}
			// F8 - Discount
			else if (e.key === 'F8') {
				e.preventDefault();
				this.apply_discount();
			}
			// Escape - Clear search
			else if (e.key === 'Escape') {
				$main.find('#pos-search').val('').trigger('input');
			}
		});
	}

	setup_barcode_listener() {
		// Listen for barcode scanner (fast typing)
		$(document).on('keypress', (e) => {
			// Skip if in input field
			if ($(e.target).is('input, textarea')) {
				return;
			}

			clearTimeout(this.barcode_timeout);
			
			if (e.which === 13) { // Enter - end of barcode
				if (this.barcode_buffer.length > 3) {
					this.search_and_add_item(this.barcode_buffer);
					this.barcode_buffer = '';
				}
			} else {
				this.barcode_buffer += String.fromCharCode(e.which);
				
				// Reset buffer after 100ms
				this.barcode_timeout = setTimeout(() => {
					this.barcode_buffer = '';
				}, 100);
			}
		});
	}

	load_pos_data() {
		frappe.call({
			method: 'modern_pos.api.get_pos_data',
			callback: (r) => {
				if (r.message) {
					this.pos_data = r.message;
					this.pos_profile = r.message.pos_profile;
					this.items = r.message.items;
					this.customers = r.message.customers;
					this.payment_methods = r.message.payment_methods;
					this.item_groups = r.message.item_groups;
					
					this.render_items();
					this.render_customers();
					this.render_categories();
					
					frappe.show_alert({
						message: __('POS loaded successfully'),
						indicator: 'green'
					});
				}
			},
			error: () => {
				frappe.msgprint({
					title: __('Error'),
					message: __('Failed to load POS data. Please check POS Profile configuration.'),
					indicator: 'red'
				});
			}
		});
	}

	render_items(items=null) {
		const items_to_render = items || this.items;
		const $container = this.page.main.find('#products-container');

		if (!items_to_render || items_to_render.length === 0) {
			$container.html(`
				<div style="grid-column: 1/-1; text-center; padding: 60px 20px; color: #999;">
					<i class="fa fa-inbox" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i>
					<p>${__('No items found')}</p>
				</div>
			`);
			return;
		}

		let html = '';
		items_to_render.forEach(item => {
			const image = item.image || '/assets/erpnext/images/item-default.jpg';
			const stock_color = item.actual_qty > 0 ? '#4caf50' : '#f44336';
			const stock_text = item.actual_qty > 0 ? `${item.actual_qty} ${item.stock_uom}` : 'Out of Stock';

			html += `
				<div class="pos-product-card" data-item-code="${item.item_code}" 
					style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; background: white;">
					<div class="product-image" style="height: 120px; background: #f5f5f5; position: relative; overflow: hidden;">
						<img src="${image}" style="width: 100%; height: 100%; object-fit: cover;">
						<div style="position: absolute; top: 8px; right: 8px; background: ${stock_color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
							${stock_text}
						</div>
					</div>
					<div class="product-details" style="padding: 10px;">
						<div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; height: 32px; overflow: hidden; line-height: 16px;">
							${item.item_name}
						</div>
						<div style="color: #666; font-size: 11px; margin-bottom: 6px;">
							${item.item_code}
						</div>
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-size: 16px; font-weight: 700; color: #2196f3;">
								₹${format_currency(item.rate, this.pos_data.currency, 0)}
							</span>
							<button class="btn btn-xs btn-primary add-to-cart-btn">
								<i class="fa fa-plus"></i>
							</button>
						</div>
					</div>
				</div>
			`;
		});

		$container.html(html);

		// Add click handlers
		$container.find('.pos-product-card').on('click', (e) => {
			const item_code = $(e.currentTarget).data('item-code');
			this.add_to_cart(item_code);
		});

		// Hover effect
		$container.find('.pos-product-card').hover(
			function() {
				$(this).css({
					'transform': 'translateY(-4px)',
					'box-shadow': '0 4px 12px rgba(0,0,0,0.15)'
				});
			},
			function() {
				$(this).css({
					'transform': 'translateY(0)',
					'box-shadow': 'none'
				});
			}
		);
	}

	render_categories() {
		const $container = this.page.main.find('#pos-categories');
		
		// Get unique categories
		const categories = [...new Set(this.items.map(item => item.pos_category || item.item_group))];
		
		let html = `
			<button class="btn btn-sm btn-default category-btn active" data-category="">
				<i class="fa fa-th"></i> ${__('All')}
			</button>
		`;
		
		categories.forEach(cat => {
			html += `
				<button class="btn btn-sm btn-default category-btn" data-category="${cat}">
					${cat}
				</button>
			`;
		});
		
		$container.html(html);

		// Add click handlers
		$container.find('.category-btn').on('click', (e) => {
			$container.find('.category-btn').removeClass('active btn-primary').addClass('btn-default');
			$(e.currentTarget).removeClass('btn-default').addClass('btn-primary active');
			
			const category = $(e.currentTarget).data('category');
			this.filter_by_category(category);
		});
	}

	render_customers() {
		const $select = this.page.main.find('#customer-select');
		
		let html = '<option value="">' + __('Walk-in Customer') + '</option>';
		
		this.customers.forEach(cust => {
			html += `<option value="${cust.customer_code}">${cust.customer_name}</option>`;
		});
		
		$select.html(html);
	}

	filter_products(query) {
		if (!query) {
			this.render_items();
			return;
		}

		const filtered = this.items.filter(item => {
			return item.item_name.toLowerCase().includes(query.toLowerCase()) ||
				   item.item_code.toLowerCase().includes(query.toLowerCase());
		});

		this.render_items(filtered);
	}

	filter_by_category(category) {
		if (!category) {
			this.render_items();
			return;
		}

		const filtered = this.items.filter(item => {
			return (item.pos_category || item.item_group) === category;
		});

		this.render_items(filtered);
	}

	search_and_add_item(barcode) {
		frappe.call({
			method: 'modern_pos.api.search_items',
			args: {
				query: barcode,
				pos_profile: this.pos_profile.name
			},
			callback: (r) => {
				if (r.message && r.message.length > 0) {
					this.add_to_cart(r.message[0].item_code);
					
					frappe.show_alert({
						message: __('Item added: {0}', [r.message[0].item_name]),
						indicator: 'green'
					});
				} else {
					frappe.show_alert({
						message: __('Item not found'),
						indicator: 'orange'
					});
				}
			}
		});
	}

	add_to_cart(item_code, qty=1) {
		// Find item
		const item = this.items.find(i => i.item_code === item_code);
		
		if (!item) {
			frappe.msgprint(__('Item not found'));
			return;
		}

		// Check if item already in cart
		const cart_item = this.cart.find(i => i.item_code === item_code);
		
		if (cart_item) {
			cart_item.qty += qty;
			cart_item.amount = cart_item.qty * cart_item.rate;
		} else {
			this.cart.push({
				item_code: item.item_code,
				item_name: item.item_name,
				qty: qty,
				rate: item.rate,
				amount: qty * item.rate,
				stock_uom: item.stock_uom,
				discount_percentage: 0
			});
		}

		this.render_cart();
		this.calculate_totals();
	}

	render_cart() {
		const $container = this.page.main.find('#cart-items');

		if (this.cart.length === 0) {
			$container.html(`
				<div class="text-center" style="padding: 60px 20px; color: #999;">
					<i class="fa fa-shopping-cart" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i>
					<p>${__('Cart is empty')}</p>
					<small>${__('Scan or click items to add')}</small>
				</div>
			`);
			return;
		}

		let html = '<div style="padding: 15px;">';
		
		this.cart.forEach((item, index) => {
			html += `
				<div class="cart-item" data-index="${index}" style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 10px; background: white;">
					<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
						<div style="flex: 1;">
							<strong style="font-size: 14px;">${item.item_name}</strong><br>
							<small style="color: #666;">${item.item_code}</small>
						</div>
						<button class="btn btn-xs btn-danger remove-item-btn" data-index="${index}">
							<i class="fa fa-trash"></i>
						</button>
					</div>
					<div style="display: flex; justify-content: space-between; align-items: center;">
						<div style="display: flex; align-items: center; gap: 8px;">
							<button class="btn btn-xs btn-default qty-decrease" data-index="${index}">
								<i class="fa fa-minus"></i>
							</button>
							<input type="number" class="form-control input-sm qty-input" data-index="${index}" 
								value="${item.qty}" style="width: 60px; text-align: center;" min="1">
							<button class="btn btn-xs btn-default qty-increase" data-index="${index}">
								<i class="fa fa-plus"></i>
							</button>
							<span style="color: #666;">× ₹${item.rate}</span>
						</div>
						<strong style="font-size: 16px; color: #2196f3;">
							₹${format_currency(item.amount, this.pos_data.currency, 2)}
						</strong>
					</div>
				</div>
			`;
		});
		
		html += '</div>';
		
		$container.html(html);

		// Add event handlers
		$container.find('.remove-item-btn').on('click', (e) => {
			const index = $(e.currentTarget).data('index');
			this.remove_from_cart(index);
		});

		$container.find('.qty-decrease').on('click', (e) => {
			const index = $(e.currentTarget).data('index');
			this.update_cart_qty(index, this.cart[index].qty - 1);
		});

		$container.find('.qty-increase').on('click', (e) => {
			const index = $(e.currentTarget).data('index');
			this.update_cart_qty(index, this.cart[index].qty + 1);
		});

		$container.find('.qty-input').on('change', (e) => {
			const index = $(e.currentTarget).data('index');
			const qty = parseInt($(e.currentTarget).val()) || 1;
			this.update_cart_qty(index, qty);
		});
	}

	update_cart_qty(index, qty) {
		if (qty < 1) {
			this.remove_from_cart(index);
			return;
		}

		this.cart[index].qty = qty;
		this.cart[index].amount = qty * this.cart[index].rate;
		
		this.render_cart();
		this.calculate_totals();
	}

	remove_from_cart(index) {
		this.cart.splice(index, 1);
		this.render_cart();
		this.calculate_totals();
	}

	calculate_totals() {
		let subtotal = 0;
		let discount = 0;
		let tax = 0;

		this.cart.forEach(item => {
			subtotal += item.amount;
			if (item.discount_percentage) {
				discount += (item.amount * item.discount_percentage / 100);
			}
		});

		const total = subtotal - discount + tax;

		this.page.main.find('#cart-subtotal').text(format_currency(subtotal, this.pos_data.currency));
		this.page.main.find('#cart-discount').text('-' + format_currency(discount, this.pos_data.currency));
		this.page.main.find('#cart-tax').text(format_currency(tax, this.pos_data.currency));
		this.page.main.find('#cart-total').text(format_currency(total, this.pos_data.currency));

		this.totals = {
			subtotal: subtotal,
			discount: discount,
			tax: tax,
			total: total
		};
	}

	select_customer(customer_code) {
		if (customer_code) {
			frappe.call({
				method: 'modern_pos.api.get_customer_details',
				args: { customer: customer_code },
				callback: (r) => {
					if (r.message) {
						this.selected_customer = r.message;
					}
				}
			});
		} else {
			this.selected_customer = null;
		}
	}

	show_new_customer_dialog() {
		let d = new frappe.ui.Dialog({
			title: __('New Customer'),
			fields: [
				{
					fieldname: 'customer_name',
					fieldtype: 'Data',
					label: __('Customer Name'),
					reqd: 1
				},
				{
					fieldname: 'mobile_no',
					fieldtype: 'Data',
					label: __('Mobile Number')
				},
				{
					fieldname: 'email_id',
					fieldtype: 'Data',
					label: __('Email')
				}
			],
			primary_action_label: __('Create'),
			primary_action: (values) => {
				frappe.call({
					method: 'modern_pos.api.quick_create_customer',
					args: values,
					callback: (r) => {
						if (r.message && r.message.success) {
							frappe.show_alert({
								message: r.message.message,
								indicator: 'green'
							});
							
							d.hide();
							
							// Reload customers
							this.customers.push(r.message.customer);
							this.render_customers();
							
							// Select new customer
							this.page.main.find('#customer-select').val(r.message.customer.name);
							this.select_customer(r.message.customer.name);
						}
					}
				});
			}
		});

		d.show();
	}

	apply_discount() {
		if (this.cart.length === 0) {
			frappe.msgprint(__('Cart is empty'));
			return;
		}

		let d = new frappe.ui.Dialog({
			title: __('Apply Discount'),
			fields: [
				{
					fieldname: 'discount_type',
					fieldtype: 'Select',
					label: __('Discount Type'),
					options: 'Percentage\nAmount',
					default: 'Percentage'
				},
				{
					fieldname: 'discount_value',
					fieldtype: 'Float',
					label: __('Discount Value'),
					reqd: 1
				}
			],
			primary_action_label: __('Apply'),
			primary_action: (values) => {
				// Apply discount to all items equally
				const discount_per_item = values.discount_type === 'Percentage' 
					? values.discount_value 
					: (values.discount_value / this.cart.length);

				this.cart.forEach(item => {
					if (values.discount_type === 'Percentage') {
						item.discount_percentage = discount_per_item;
					} else {
						item.discount_percentage = (discount_per_item / item.amount) * 100;
					}
				});

				this.calculate_totals();
				d.hide();
				
				frappe.show_alert({
					message: __('Discount applied'),
					indicator: 'green'
				});
			}
		});

		d.show();
	}

	show_payment_dialog() {
		if (this.cart.length === 0) {
			frappe.msgprint(__('Cart is empty'));
			return;
		}

		const total = this.totals.total;
		
		let d = new frappe.ui.Dialog({
			title: __('Payment'),
			size: 'large',
			fields: [
				{
					fieldtype: 'HTML',
					options: `
						<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
							<h2 style="margin: 0; color: #1976d2;">₹${format_currency(total, this.pos_data.currency, 2)}</h2>
							<p style="margin: 5px 0 0 0; color: #666;">${__('Total Amount')}</p>
						</div>
					`
				},
				{
					fieldname: 'payments_section',
					fieldtype: 'Section Break',
					label: __('Payment Methods')
				},
				{
					fieldname: 'payment_method',
					fieldtype: 'Select',
					label: __('Payment Method'),
					options: this.payment_methods.map(pm => pm.mode_of_payment).join('\n'),
					default: this.payment_methods.find(pm => pm.default)?.mode_of_payment || this.payment_methods[0]?.mode_of_payment,
					reqd: 1
				},
				{
					fieldname: 'amount_paid',
					fieldtype: 'Currency',
					label: __('Amount Paid'),
					default: total,
					reqd: 1,
					onchange: function() {
						const paid = this.get_value();
						const change = paid - total;
						d.fields_dict.change_html.$wrapper.html(`
							<div style="background: ${change >= 0 ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 6px; text-align: center;">
								<h3 style="margin: 0; color: ${change >= 0 ? '#4caf50' : '#f44336'};">
									${change >= 0 ? 'Change: ' : 'Short: '}₹${format_currency(Math.abs(change), 'INR', 2)}
								</h3>
							</div>
						`);
					}
				},
				{
					fieldname: 'change_html',
					fieldtype: 'HTML',
					options: '<div></div>'
				}
			],
			primary_action_label: __('Complete Sale'),
			primary_action: (values) => {
				if (values.amount_paid < total) {
					frappe.msgprint(__('Payment amount is less than total'));
					return;
				}

				this.complete_sale(values);
				d.hide();
			}
		});

		d.show();

		// Trigger initial change calculation
		d.set_value('amount_paid', total);
	}

	complete_sale(payment_data) {
		const invoice_data = {
			pos_profile: this.pos_profile.name,
			company: this.pos_profile.company,
			customer: this.selected_customer ? this.selected_customer.customer_code : this.pos_profile.customer,
			items: this.cart,
			payments: [{
				mode_of_payment: payment_data.payment_method,
				amount: payment_data.amount_paid
			}],
			customer_mobile: this.selected_customer?.mobile_no,
			customer_email: this.selected_customer?.email_id
		};

		frappe.call({
			method: 'modern_pos.api.create_sales_invoice',
			args: { data: invoice_data },
			freeze: true,
			freeze_message: __('Processing sale...'),
			callback: (r) => {
				if (r.message && r.message.success) {
					frappe.show_alert({
						message: __('Sale completed: {0}', [r.message.invoice_name]),
						indicator: 'green'
					}, 5);

					// Show print dialog
					this.show_print_dialog(r.message.invoice_name);

					// Clear cart
					this.clear_cart();
				}
			},
			error: (r) => {
				frappe.msgprint({
					title: __('Error'),
					message: __('Failed to complete sale. Please try again.'),
					indicator: 'red'
				});
			}
		});
	}

	show_print_dialog(invoice_name) {
		frappe.confirm(
			__('Do you want to print the receipt?'),
			() => {
				// Print
				frappe.set_route('print', 'Sales Invoice', invoice_name);
			},
			() => {
				// Don't print - just continue
			}
		);
	}

	clear_cart() {
		this.cart = [];
		this.selected_customer = null;
		this.page.main.find('#customer-select').val('');
		this.render_cart();
		this.calculate_totals();
	}

	hold_sale() {
		if (this.cart.length === 0) {
			frappe.msgprint(__('Cart is empty'));
			return;
		}

		const hold_data = {
			cart: this.cart,
			customer: this.selected_customer,
			timestamp: frappe.datetime.now_datetime()
		};

		frappe.call({
			method: 'modern_pos.api.hold_invoice',
			args: { data: hold_data },
			callback: (r) => {
				if (r.message && r.message.success) {
					frappe.show_alert({
						message: __('Sale held successfully'),
						indicator: 'green'
					});
					
					this.clear_cart();
				}
			}
		});
	}

	show_settings() {
		frappe.msgprint(__('Settings dialog coming soon!'));
	}

	close_pos() {
		frappe.confirm(
			__('Are you sure you want to close POS?'),
			() => {
				frappe.set_route('');
			}
		);
	}
}
