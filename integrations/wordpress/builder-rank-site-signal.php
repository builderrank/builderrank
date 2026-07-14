<?php
/**
 * Plugin Name: Builder Rank Site Signal
 * Description: Installs the Builder Rank Site Signal tracking snippet on a WordPress website.
 * Version: 0.1.0
 * Author: Builder Rank
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

const BUILDER_RANK_SITE_SIGNAL_OPTION = 'builder_rank_site_signal_options';

add_action('admin_menu', 'builder_rank_site_signal_add_settings_page');
add_action('admin_init', 'builder_rank_site_signal_register_settings');
add_action('wp_head', 'builder_rank_site_signal_print_tracker', 20);

function builder_rank_site_signal_add_settings_page() {
    add_options_page(
        'Builder Rank Site Signal',
        'Builder Rank Site Signal',
        'manage_options',
        'builder-rank-site-signal',
        'builder_rank_site_signal_render_settings_page'
    );
}

function builder_rank_site_signal_register_settings() {
    register_setting('builder_rank_site_signal', BUILDER_RANK_SITE_SIGNAL_OPTION, [
        'type' => 'array',
        'sanitize_callback' => 'builder_rank_site_signal_sanitize_options',
        'default' => [
            'site_id' => '',
            'endpoint' => 'https://builderrank.io/api/track',
            'track_logged_in' => '0',
        ],
    ]);

    add_settings_section(
        'builder_rank_site_signal_main',
        'Site Signal Settings',
        '__return_false',
        'builder-rank-site-signal'
    );

    add_settings_field(
        'builder_rank_site_signal_site_id',
        'Site Signal ID',
        'builder_rank_site_signal_render_site_id_field',
        'builder-rank-site-signal',
        'builder_rank_site_signal_main'
    );

    add_settings_field(
        'builder_rank_site_signal_endpoint',
        'Tracking endpoint',
        'builder_rank_site_signal_render_endpoint_field',
        'builder-rank-site-signal',
        'builder_rank_site_signal_main'
    );

    add_settings_field(
        'builder_rank_site_signal_track_logged_in',
        'Track logged-in users',
        'builder_rank_site_signal_render_track_logged_in_field',
        'builder-rank-site-signal',
        'builder_rank_site_signal_main'
    );
}

function builder_rank_site_signal_sanitize_options($input) {
    $site_id = isset($input['site_id']) ? sanitize_text_field($input['site_id']) : '';
    $endpoint = isset($input['endpoint']) ? esc_url_raw($input['endpoint']) : 'https://builderrank.io/api/track';
    $track_logged_in = !empty($input['track_logged_in']) ? '1' : '0';

    if (!preg_match('/^br_[a-zA-Z0-9_\/-]{3,80}$/', $site_id)) {
        $site_id = '';
        add_settings_error(
            BUILDER_RANK_SITE_SIGNAL_OPTION,
            'builder_rank_site_signal_invalid_site_id',
            'Site Signal ID must start with br_ and use only letters, numbers, dashes, underscores, or slashes.'
        );
    }

    if (!$endpoint) {
        $endpoint = 'https://builderrank.io/api/track';
    }

    return [
        'site_id' => $site_id,
        'endpoint' => $endpoint,
        'track_logged_in' => $track_logged_in,
    ];
}

function builder_rank_site_signal_render_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1>Builder Rank Site Signal</h1>
        <p>Add the Site Signal ID from your Builder Rank dashboard, then save. The tracking snippet will be added to public pages automatically.</p>
        <form method="post" action="options.php">
            <?php
            settings_fields('builder_rank_site_signal');
            do_settings_sections('builder-rank-site-signal');
            submit_button('Save Site Signal Settings');
            ?>
        </form>
    </div>
    <?php
}

function builder_rank_site_signal_render_site_id_field() {
    $options = builder_rank_site_signal_options();
    ?>
    <input
        type="text"
        name="<?php echo esc_attr(BUILDER_RANK_SITE_SIGNAL_OPTION); ?>[site_id]"
        value="<?php echo esc_attr($options['site_id']); ?>"
        class="regular-text"
        placeholder="br_customer_site_id"
    />
    <p class="description">Find this in Builder Rank under Account or Dashboard > Site Signal.</p>
    <?php
}

function builder_rank_site_signal_render_endpoint_field() {
    $options = builder_rank_site_signal_options();
    ?>
    <input
        type="url"
        name="<?php echo esc_attr(BUILDER_RANK_SITE_SIGNAL_OPTION); ?>[endpoint]"
        value="<?php echo esc_attr($options['endpoint']); ?>"
        class="regular-text"
        placeholder="https://builderrank.io/api/track"
    />
    <p class="description">Use the default endpoint unless Builder Rank support gives you a custom URL.</p>
    <?php
}

function builder_rank_site_signal_render_track_logged_in_field() {
    $options = builder_rank_site_signal_options();
    ?>
    <label>
        <input
            type="checkbox"
            name="<?php echo esc_attr(BUILDER_RANK_SITE_SIGNAL_OPTION); ?>[track_logged_in]"
            value="1"
            <?php checked($options['track_logged_in'], '1'); ?>
        />
        Track logged-in WordPress users
    </label>
    <p class="description">Leave off during beta QA so admin visits do not pollute customer website data.</p>
    <?php
}

function builder_rank_site_signal_print_tracker() {
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
        return;
    }

    $options = builder_rank_site_signal_options();
    if ($options['track_logged_in'] !== '1' && is_user_logged_in()) {
        return;
    }

    $site_id = $options['site_id'];
    $endpoint = $options['endpoint'];

    if (!$site_id || !$endpoint) {
        return;
    }

    printf(
        '<script src="%s/tracker.js" data-site-id="%s" data-endpoint="%s" async></script>' . "\n",
        esc_url('https://builderrank.io'),
        esc_attr($site_id),
        esc_url($endpoint)
    );
}

function builder_rank_site_signal_options() {
    $options = get_option(BUILDER_RANK_SITE_SIGNAL_OPTION, []);

    return wp_parse_args($options, [
        'site_id' => '',
        'endpoint' => 'https://builderrank.io/api/track',
        'track_logged_in' => '0',
    ]);
}
